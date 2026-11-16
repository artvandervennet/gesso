import { paint, roughFilter, rng, seedFrom, ON_WALL, define, reducedMotion } from './brush.js';

/**
 * <art-gitflow> — a timeline drawn as a painted git graph.
 * Write an ordinary ordered list. Each item says which branch it was committed to;
 * the component paints the branches, forks and merges beside it and reveals them as you scroll.
 *
 *   <art-gitflow>
 *     <ol>
 *       <li data-branch="main"><time>2018</time><h3>Started studying</h3>…</li>
 *       <li data-branch="side/solid" data-pigment="complement"><time>2024</time>…</li>
 *       <li data-branch="side/solid">…</li>              ← last commit: merges back into main
 *       <li data-branch="work/bouwflow" data-open>…</li>  ← still running: never merges
 *     </ol>
 *   </art-gitflow>
 *
 * Item attributes
 *   data-branch   branch name, shown as a label (default "main")
 *   data-pigment  colour for the branch, set on its first item
 *   data-open     the branch is still going: it runs off the bottom instead of merging
 *   data-current  marks the commit you are at now (gets a ring)
 *
 * Element attributes
 *   seed          changes the brushwork
 *   static        draw everything at once, no scroll reveal
 *
 * The list stays a list: the graph is aria-hidden, and branch names are inserted as visible text.
 * Uses light DOM so your own list styles still apply.
 */
const STYLE_ID = 'art-gitflow-style';
const css = `
art-gitflow { --lane: 2rem; --gutter: calc(var(--lanes, 1) * var(--lane) + 1.5rem); display: block; position: relative; }
art-gitflow > ol { list-style: none; padding: 0; margin: 0; padding-inline-start: var(--gutter); display: grid; gap: var(--space-8); }
art-gitflow > ol > li { position: relative; max-inline-size: none; }
art-gitflow > ol > li > :is(h3, h4) { margin-block: 0.15em 0.2em; }
art-gitflow > ol > li > p { color: var(--ink-muted); }
art-gitflow .art-gitflow-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--space-3); font-size: var(--step--1); color: var(--ink-muted); }
art-gitflow .art-gitflow-meta :is(time, .when) { font-weight: var(--weight-bold); color: var(--ink); }
art-gitflow .art-gitflow-branch { font-family: var(--font-mono); font-size: 0.92em; color: var(--ink-muted); background: none; padding: 0; }
art-gitflow .art-gitflow-branch::before { content: ""; display: inline-block; inline-size: 0.6em; block-size: 0.6em; margin-inline-end: 0.35em; border-radius: 45% 55% 50% 50%; background: var(--c); vertical-align: 0.02em; }
art-gitflow > svg { position: absolute; inset-block-start: 0; inset-inline-start: 0; overflow: visible; pointer-events: none; }
@media (max-width: 40rem) { art-gitflow { --lane: 1.25rem; } }
`;

const f = (n) => Math.round(n * 10) / 10;

class ArtGitflow extends HTMLElement {
  #ro; #onScroll; #raf = 0;

  connectedCallback() {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style'); s.id = STYLE_ID; s.textContent = css;
      document.head.prepend(s); // prepend so page styles can override
    }
    this.list = this.querySelector(':scope > ol, :scope > ul');
    if (!this.list) return;
    this.model();
    this.labels();
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.setAttribute('focusable', 'false');
    this.prepend(this.svg);
    this.#ro = new ResizeObserver(() => this.draw());
    this.#ro.observe(this);
    this.#onScroll = () => { cancelAnimationFrame(this.#raf); this.#raf = requestAnimationFrame(() => this.reveal()); };
    addEventListener('scroll', this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    removeEventListener('scroll', this.#onScroll);
  }

  /** Work out branches, their lanes and colours from the list. */
  model() {
    const items = [...this.list.children];
    const branches = new Map();
    const spare = ON_WALL.filter((p) => p !== 'brand');
    items.forEach((li, i) => {
      const name = li.dataset.branch || 'main';
      if (!branches.has(name)) {
        branches.set(name, {
          name, first: i, last: i, open: false,
          pigment: li.dataset.pigment || (name === 'main' ? 'accent' : spare[(branches.size - 1) % spare.length]),
        });
      }
      const b = branches.get(name);
      b.last = i;
      if (li.hasAttribute('data-open')) b.open = true;
    });
    // first-fit lane assignment: a lane is free again once its branch has merged
    const lanesEnd = [Infinity]; // lane 0 is main, forever
    for (const b of branches.values()) {
      if (b.name === 'main') { b.lane = 0; continue; }
      let lane = lanesEnd.findIndex((end, k) => k > 0 && end < b.first);
      if (lane === -1) { lane = lanesEnd.length; lanesEnd.push(0); }
      lanesEnd[lane] = b.open ? Infinity : b.last;
      b.lane = lane;
    }
    this.items = items;
    this.branches = branches;
    this.style.setProperty('--lanes', String(lanesEnd.length));
  }

  /** Put the date and branch name on one meta line, as real text. */
  labels() {
    for (const li of this.items) {
      if (li.querySelector('.art-gitflow-branch')) continue;
      const b = this.branches.get(li.dataset.branch || 'main');
      const meta = document.createElement('div');
      meta.className = 'art-gitflow-meta';
      const time = li.querySelector(':scope > time, :scope > .when');
      if (time) meta.append(time);
      const code = document.createElement('code');
      code.className = 'art-gitflow-branch';
      code.textContent = b.name;
      code.style.setProperty('--c', paint(b.pigment));
      meta.append(code);
      li.prepend(meta);
    }
  }

  draw() {
    const seed = seedFrom(this.getAttribute('seed'), 4);
    const r = rng(seed);
    const lane = parseFloat(getComputedStyle(this).getPropertyValue('--lane')) * parseFloat(getComputedStyle(document.documentElement).fontSize) || 26;
    const x = (l) => 14 + l * lane;
    const H = this.offsetHeight;
    const W = x(this.style.getPropertyValue('--lanes') - 1) + 20;
    const listTop = this.list.offsetTop;
    const y = (i) => listTop + this.items[i].offsetTop + 13; // aligned with the meta line
    const bend = Math.min(56, lane * 2.4);

    const paths = [], dabs = [];
    const brush = (d, color, width) => {
      paths.push(`<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
      // dry-brush streak along the stroke: canvas showing through
      paths.push(`<path d="${d}" stroke="var(--surface)" stroke-width="${f(width * 0.22)}" fill="none" stroke-dasharray="${f(8 + r() * 30)} ${f(14 + r() * 40)}" stroke-dashoffset="${f(r() * 40)}" opacity=".6"/>`);
    };

    const main = this.branches.get('main');
    const lastMain = main ? y(main.last) : 0;
    const anyOpenBelow = [...this.branches.values()].some((b) => b.open);
    brush(`M${x(0)} ${f(y(0) - 18)} V${f(anyOpenBelow ? H : lastMain)}`, paint(main?.pigment || 'accent'), 7);

    for (const b of this.branches.values()) {
      if (b.name === 'main') continue;
      const bx = x(b.lane), y0 = y(b.first), y1 = y(b.last);
      const forkAt = Math.max(y(0), y0 - bend - 12);
      let d = `M${x(0)} ${f(forkAt)} C${x(0)} ${f(forkAt + bend * 0.55)} ${bx} ${f(y0 - bend * 0.55 - 12)} ${bx} ${f(y0 - 12)} V${f(y1)}`;
      if (b.open) d += ` V${f(H)}`;
      else {
        const m = y1 + 14;
        d += ` C${bx} ${f(m + bend * 0.45)} ${x(0)} ${f(m + bend * 0.55)} ${x(0)} ${f(m + bend)}`;
      }
      brush(d, paint(b.pigment), 5.5);
    }

    this.items.forEach((li, i) => {
      const b = this.branches.get(li.dataset.branch || 'main');
      const cx = x(b.lane), cy = y(i), s = b.lane === 0 ? 10 : 8.5;
      // an imperfect dab of paint, not a perfect circle
      const k = () => f(s * (0.85 + r() * 0.3));
      const blob = `M${cx - k()} ${cy} C${cx - k()} ${cy - k()} ${cx + k()} ${cy - k()} ${cx + k()} ${cy} C${cx + k()} ${cy + k()} ${cx - k()} ${cy + k()} ${cx - k()} ${cy}Z`;
      if (li.hasAttribute('data-current')) dabs.push(`<circle cx="${cx}" cy="${cy}" r="${s + 6}" fill="none" stroke="${paint(b.pigment)}" stroke-width="2" opacity=".55"/>`);
      dabs.push(`<path d="${blob}" fill="${paint(b.pigment)}" stroke="var(--surface)" stroke-width="2.5" paint-order="stroke"/>`);
    });

    const id = `gf${seed}`;
    this.svg.setAttribute('width', W);
    this.svg.setAttribute('height', H);
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.innerHTML = `
      <defs>
        ${roughFilter(id, seed, 2.2, 0.04)}
        <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".95" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
        <mask id="${id}m" maskUnits="userSpaceOnUse" x="-20" y="0" width="${W + 40}" height="${H}">
          <rect class="wet" x="-20" y="0" width="${W + 40}" height="${H}" fill="url(#${id}f)"/>
        </mask>
      </defs>
      <g mask="url(#${id}m)"><g filter="url(#${id})">${paths.join('')}</g>${dabs.join('')}</g>`;
    this.wet = this.svg.querySelector('.wet');
    this.H = H;
    this.reveal();
  }

  /** Paint down the graph as the list scrolls through the viewport. */
  reveal() {
    if (!this.wet) return;
    if (this.hasAttribute('static') || reducedMotion()) { this.wet.setAttribute('height', this.H); return; }
    const rect = this.getBoundingClientRect();
    const painted = Math.max(0, Math.min(this.H, innerHeight * 0.7 - rect.top));
    this.dry = Math.max(this.dry || 0, painted); // paint doesn't come off when you scroll back up
    this.wet.setAttribute('height', f(this.dry));
  }
}

define('art-gitflow', ArtGitflow);
export { ArtGitflow };
