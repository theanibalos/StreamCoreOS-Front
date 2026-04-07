<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { get } from '$lib/api/client';

	// ── Tipos ─────────────────────────────────────────────────────────────────
	interface GraphNode extends d3.SimulationNodeDatum {
		id: string;
		uniqueId: string;
		type: 'plugin' | 'tool' | 'event';
		label: string;
		domain?: string;
		parentPlugin?: string;
	}

	interface GraphLink extends d3.SimulationLinkDatum<any> {
		id: string;
		type: 'orbital' | 'subscription';
	}

	// ── Estado ─────────────────────────────────────────────────────────────────
	let svgElement: SVGSVGElement;
	let width = $state(1200);
	let height = $state(900);
	let loading = $state(true);

	let simulation: d3.Simulation<any, any>;
	let nodes = $state<GraphNode[]>([]);
	let links = $state<GraphLink[]>([]);
	let domains = $state<string[]>([]);

	const COLORS = {
		plugin: '#a6e3a1',
		tool: '#89b4fa',
		event: '#fab387',
		line: 'rgba(49, 50, 68, 0.4)',
		eventLine: '#fab387'
	};

	function getToolColor(name: string) {
		const n = name.toLowerCase();
		if (n.includes('db')) return '#89b4fa';
		if (n.includes('auth')) return '#f9e2af';
		if (n.includes('twitch')) return '#cba6f7';
		if (n.includes('bus')) return '#fab387';
		if (n.includes('http')) return '#89dceb';
		if (n.includes('log')) return '#94e2d5';
		return '#6c7086';
	}

	function cleanName(name: string) {
		if (!name || name === "Unknown") return null;
		return name.split('.')[0].split('_').pop() || name;
	}

	async function initGraph() {
		loading = true;
		try {
			const [statusRes, eventsRes] = await Promise.all([
				get<any>('/system/status'),
				get<any>('/system/events')
			]);

			const newNodes: GraphNode[] = [];
			const newLinks: GraphLink[] = [];
			const pluginMap = new Map();
			const domainSet = new Set<string>();

			// 1. Procesar Plugins y sus Dominios
			statusRes.data.plugins.forEach((p: any) => {
				const domain = p.domain || 'system';
				domainSet.add(domain);
				
				const pId = p.name;
				const pNode: GraphNode = {
					id: pId, uniqueId: pId, type: 'plugin', 
					label: pId.replace(/Plugin$/, ''),
					domain: domain
				};
				newNodes.push(pNode);
				pluginMap.set(pId, pNode);

				(p.tools || []).forEach((tName: string) => {
					const tId = `${pId}_${tName}`;
					newNodes.push({
						id: tName, uniqueId: tId, type: 'tool', label: tName, 
						parentPlugin: pId, domain: domain
					});
					newLinks.push({ id: `orb:${tId}`, source: pId, target: tId, type: 'orbital' });
				});
			});

			// 2. Procesar Eventos
			if (eventsRes.data?.events) {
				eventsRes.data.events.forEach((ev: any) => {
					const evId = `event:${ev.event}`;
					newNodes.push({
						id: ev.event, uniqueId: evId, type: 'event', label: ev.event
					});

					ev.subscribers.forEach((subFull: string) => {
						const subName = cleanName(subFull);
						if (subName && pluginMap.has(subName)) {
							newLinks.push({ id: `sub:${evId}-${subName}`, source: evId, target: subName, type: 'subscription' });
						}
					});

					ev.last_emitters.forEach((emFull: string) => {
						const emName = cleanName(emFull);
						if (emName && pluginMap.has(emName)) {
							newLinks.push({ id: `pub:${emName}-${evId}`, source: emName, target: evId, type: 'subscription' });
						}
					});
				});
			}

			domains = Array.from(domainSet);
			nodes = newNodes;
			links = newLinks;
			draw();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function draw() {
		if (!svgElement || nodes.length === 0) return;
		const nData = $state.snapshot(nodes);
		const lData = $state.snapshot(links);

		const svg = d3.select(svgElement);
		svg.selectAll('*').remove();

		// Definir gradientes y filtros
		const defs = svg.append('defs');
		defs.append('filter').attr('id', 'glow')
			.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');

		const container = svg.append('g');

		// Calcular centros de dominios (Distribución circular de islas)
		const domainCenters: Record<string, {x: number, y: number}> = {};
		domains.forEach((d, i) => {
			const angle = (i / domains.length) * 2 * Math.PI;
			const radius = Math.min(width, height) * 0.35;
			domainCenters[d] = {
				x: width / 2 + Math.cos(angle) * radius,
				y: height / 2 + Math.sin(angle) * radius
			};
		});

		// SIMULACIÓN POR ISLAS
		simulation = d3.forceSimulation(nData)
			.force('link', d3.forceLink(lData).id((d: any) => d.uniqueId)
				.distance(d => d.type === 'orbital' ? 35 : 180)
				.strength(d => d.type === 'orbital' ? 1.5 : 0.1)
			)
			.force('charge', d3.forceManyBody().strength(d => d.type === 'plugin' ? -800 : -30))
			.force('center', d3.forceCenter(width / 2, height / 2))
			// Fuerza que atrae cada nodo a su centro de dominio
			.force('x', d3.forceX().x((d: any) => d.domain ? domainCenters[d.domain].x : width / 2).strength(0.2))
			.force('y', d3.forceY().y((d: any) => d.domain ? domainCenters[d.domain].y : height / 2).strength(0.2))
			.force('collision', d3.forceCollide().radius(d => d.type === 'plugin' ? 70 : 20));

		// Dibujar Etiquetas de Dominio
		container.append('g').selectAll('text')
			.data(domains).join('text')
			.attr('x', d => domainCenters[d].x)
			.attr('y', d => domainCenters[d].y - 180)
			.attr('text-anchor', 'middle')
			.attr('fill', 'rgba(203, 166, 247, 0.3)')
			.attr('font-size', '24px').attr('font-weight', 'bold').attr('text-transform', 'uppercase')
			.text(d => d);

		// Enlaces
		const link = container.append('g')
			.selectAll('line').data(lData).join('line')
			.attr('stroke', d => d.type === 'subscription' ? COLORS.event : COLORS.line)
			.attr('stroke-width', d => d.type === 'subscription' ? 2 : 1)
			.attr('stroke-dasharray', d => d.type === 'subscription' ? '6,4' : '0')
			.attr('class', d => d.type === 'subscription' ? 'ev-line' : '')
			.attr('opacity', d => d.type === 'subscription' ? 0.3 : 0.8);

		// Nodos
		const node = container.append('g')
			.selectAll('g').data(nData).join('g')
			.style('cursor', 'grab')
			.call(d3.drag<any, any>()
				.on('start', (e) => { if (!e.active) simulation.alphaTarget(0.3).restart(); e.subject.fx = e.x; e.subject.fy = e.y; })
				.on('drag', (e) => { e.subject.fx = e.x; e.subject.fy = e.y; })
				.on('end', (e) => { if (!e.active) simulation.alphaTarget(0); e.subject.fx = null; e.subject.fy = null; }));

		// Círculo principal
		node.append('circle')
			.attr('r', d => d.type === 'plugin' ? 18 : d.type === 'event' ? 5 : 9)
			.attr('fill', d => d.type === 'plugin' ? COLORS.plugin : d.type === 'event' ? COLORS.event : getToolColor(d.id))
			.attr('stroke', '#0b0b10').attr('stroke-width', 2)
			.style('filter', d => d.type === 'event' ? 'url(#glow)' : 'none');

		// Etiquetas
		node.append('text')
			.attr('dy', d => d.type === 'plugin' ? 35 : 22)
			.attr('text-anchor', 'middle').attr('fill', d => d.type === 'event' ? COLORS.event : '#cdd6f4')
			.attr('font-size', d => d.type === 'plugin' ? '12px' : '9px')
			.attr('font-family', 'monospace').attr('font-weight', d => d.type === 'plugin' ? '600' : '400')
			.text(d => d.label);

		// Interacción avanzada
		node.on('mouseenter', (e, d: any) => {
			const related = new Set([d.uniqueId]);
			lData.forEach(l => {
				if (l.source.uniqueId === d.uniqueId || l.target.uniqueId === d.uniqueId) {
					related.add(l.source.uniqueId); related.add(l.target.uniqueId);
				}
			});
			link.transition().duration(250).attr('opacity', l => (l.source.uniqueId === d.uniqueId || l.target.uniqueId === d.uniqueId) ? 1 : 0.05).attr('stroke-width', l => (l.source.uniqueId === d.uniqueId || l.target.uniqueId === d.uniqueId) ? 4 : 1);
			node.transition().duration(250).attr('opacity', n => related.has(n.uniqueId) || n.parentPlugin === d.uniqueId ? 1 : 0.15);
		}).on('mouseleave', () => {
			link.transition().duration(250).attr('opacity', l => l.type === 'subscription' ? 0.3 : 0.8).attr('stroke-width', l => l.type === 'subscription' ? 2 : 1);
			node.transition().duration(250).attr('opacity', 1);
		});

		svg.call(d3.zoom<SVGSVGElement, any>().scaleExtent([0.1, 3]).on('zoom', (e) => container.attr('transform', e.transform)));

		simulation.on('tick', () => {
			link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
			node.attr('transform', d => `translate(${d.x},${d.y})`);
		});
	}

	onMount(initGraph);
</script>

<div class="container">
	<!-- GRID DE FONDO -->
	<div class="grid-overlay"></div>
	
	<div class="header">
		<h3>Arquitectura Basada en Dominios</h3>
		<p class="muted">Distribución aislada por contextos de negocio. Los diamantes centrales orquestan los eventos.</p>
	</div>

	<svg bind:this={svgElement}></svg>

	<div class="legend">
		<div class="l-item"><span class="c" style="background:{COLORS.plugin}; box-shadow: 0 0 10px {COLORS.plugin}"></span> Plugin</div>
		<div class="l-item"><span class="c" style="background:{COLORS.event}; box-shadow: 0 0 10px {COLORS.event}"></span> Evento</div>
		<div class="l-item"><span class="c" style="background:{COLORS.tool}"></span> Tool</div>
	</div>
</div>

<style>
	.container { width: 100%; height: 850px; background: #0b0b10; border-radius: 16px; border: 1px solid #313244; position: relative; overflow: hidden; }
	
	/* REJILLA DE INGENIERÍA */
	.grid-overlay {
		position: absolute; top: 0; left: 0; right: 0; bottom: 0;
		background-image: radial-gradient(circle, #1e1e2e 1px, transparent 1px);
		background-size: 30px 30px; opacity: 0.4; pointer-events: none;
	}

	svg { width: 100%; height: 100%; cursor: crosshair; }
	
	:global(.ev-line) { animation: flow 1.5s linear infinite; }
	@keyframes flow { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }

	.header { position: absolute; top: 1.5rem; left: 1.5rem; pointer-events: none; z-index: 10; }
	h3 { color: #cdd6f4; margin: 0; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; }
	.muted { color: #7f849c; font-size: 0.85rem; margin: 6px 0 0; }

	.legend {
		position: absolute; bottom: 1.5rem; right: 1.5rem;
		background: rgba(17, 17, 27, 0.9); padding: 12px 16px;
		border-radius: 12px; border: 1px solid #313244; backdrop-filter: blur(8px);
	}
	.l-item { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: #a6adc8; margin-bottom: 6px; font-family: monospace; }
	.c { width: 10px; height: 10px; border-radius: 50%; }
</style>
