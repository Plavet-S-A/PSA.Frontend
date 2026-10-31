/**
 * Acordeón adaptable del sidebar.
 *
 * Capa: lib/ui
 * Reglas:
 * 1. Si todo el menú cabe sin desplazarse, se muestra plano: los encabezados
 *    de sección son texto y no hay dropdowns. Las secciones con un solo módulo
 *    son enlaces directos y nunca se pliegan.
 * 2. Solo cuando el alto disponible obliga a desplazarse, las secciones con
 *    varios módulos se pliegan y nunca hay más de tres abiertas
 *    (`data-max-open`).
 * 3. Al abrir una cuarta se cierra la sección abierta más recientemente, de
 *    modo que el clic nuevo siempre quede visible.
 * 4. Sin preferencia guardada, cada rol arranca con su contexto
 *    (`data-default-open`) en lugar de un menú genérico.
 * 5. Si aun así no cabe, se cierra la sección más antigua que no sea la ruta
 *    actual ni la recién abierta para evitar el desplazamiento.
 *
 * Efectos: lee y escribe `psa:sidebar:sections`; escucha `resize`.
 */

const STORAGE_KEY = 'psa:sidebar:sections';

/**
 * Inicializa el comportamiento del menú lateral sobre el DOM ya renderizado.
 *
 * @returns Nada; es seguro llamarla cuando no existe el sidebar.
 */
export function initSidebarAccordion(): void {
  const nav = document.querySelector<HTMLElement>('.sidebar__nav');
  const toggles = [
    ...document.querySelectorAll<HTMLButtonElement>('.nav-section__toggle'),
  ];
  const maxOpen = Number(nav?.dataset.maxOpen) || 3;
  const defaultOpen = (nav?.dataset.defaultOpen ?? '').split(' ').filter(Boolean);

  const keyOf = (toggle: Element): string => toggle.getAttribute('data-section') ?? '';
  const toggleByKey = new Map(toggles.map((toggle) => [keyOf(toggle), toggle]));
  const validKeys = new Set(toggleByKey.keys());

  function loadSavedSections(): string[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? [...new Set(parsed.map(String))] : null;
    } catch {
      return null;
    }
  }

  function saveSections(order: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      /* La persistencia es opcional. */
    }
  }

  // Descarta claves desconocidas, duplicados y sobrantes.
  function normalizeKeys(keys: string[]): string[] {
    const unique = [...new Set(keys.filter((key) => validKeys.has(key)))];
    return unique.slice(-maxOpen);
  }

  const isExpanded = (toggle: Element): boolean =>
    toggle.getAttribute('aria-expanded') === 'true';

  function setExpanded(toggle: Element, next: boolean): void {
    const controls = toggle.getAttribute('aria-controls');
    const list = controls ? document.getElementById(controls) : null;
    const panel = list?.parentElement;
    toggle.setAttribute('aria-expanded', String(next));
    if (panel) panel.classList.toggle('nav-collapse--collapsed', !next);
    if (list) list.toggleAttribute('inert', !next);
  }

  const savedOpen = loadSavedSections();
  const openOrder = normalizeKeys(savedOpen ?? defaultOpen);
  let mode: 'flat' | 'accordion' = 'flat';

  function closeSection(key: string): void {
    const toggle = toggleByKey.get(key);
    if (toggle) setExpanded(toggle, false);
    const index = openOrder.indexOf(key);
    if (index >= 0) openOrder.splice(index, 1);
  }

  function openSection(key: string): void {
    const toggle = toggleByKey.get(key);
    if (!toggle || openOrder.includes(key)) return;
    if (openOrder.length >= maxOpen) closeSection(openOrder[openOrder.length - 1]);
    setExpanded(toggle, true);
    openOrder.push(key);
  }

  // Alto final estimado del acordeón. Se calcula con el contenido de cada
  // sección abierta para no depender de la transición en curso.
  function estimatedHeight(): number {
    if (!nav) return 0;
    const style = getComputedStyle(nav);
    let total = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const topLevel = [...nav.children];
    topLevel.forEach((child) => {
      total += parseFloat(getComputedStyle(child).marginTop) || 0;
      if (child.classList.contains('nav-item')) {
        total += child.getBoundingClientRect().height;
      }
    });
    const sections = [...nav.querySelectorAll<HTMLElement>('.nav-section')];
    sections.forEach((section) => {
      const toggle = section.querySelector<HTMLElement>('.nav-section__toggle');
      if (toggle) total += toggle.getBoundingClientRect().height;
      if (openOrder.includes(section.dataset.sectionId ?? '')) {
        const list = section.querySelector<HTMLElement>('.nav-list');
        if (list) total += list.scrollHeight;
      }
    });
    return total;
  }

  // La sección de la ruta actual debe quedar visible en cuanto haya acordeón.
  const activeLink = document.querySelector('.sidebar__nav .nav-item--active');
  const activeToggle = activeLink
    ?.closest('.nav-section')
    ?.querySelector('.nav-section__toggle');
  const activeKey = activeToggle ? keyOf(activeToggle) : '';

  function fitOpenSections(): void {
    if (!nav || mode !== 'accordion') return;
    let guard = 0;
    while (
      estimatedHeight() > nav.clientHeight &&
      openOrder.length > 1 &&
      guard < maxOpen
    ) {
      const protectedKeys = new Set([activeKey, openOrder[openOrder.length - 1]]);
      const candidate = openOrder.find((key) => !protectedKeys.has(key));
      if (!candidate) break;
      closeSection(candidate);
      guard += 1;
    }
    saveSections(openOrder);
  }

  if (activeKey && !openOrder.includes(activeKey)) {
    if (openOrder.length >= maxOpen) closeSection(openOrder[openOrder.length - 1]);
    openOrder.push(activeKey);
    saveSections(openOrder);
  }

  function applyMode(next: 'flat' | 'accordion', instant: boolean): void {
    if (!nav) return;
    mode = next;
    if (instant) nav.classList.add('sidebar__nav--instant');
    nav.classList.toggle('sidebar__nav--accordion', next === 'accordion');
    nav.classList.toggle('sidebar__nav--flat', next === 'flat');
    toggles.forEach((toggle) => {
      setExpanded(toggle, next === 'flat' || openOrder.includes(keyOf(toggle)));
    });
    if (instant) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => nav.classList.remove('sidebar__nav--instant'));
      });
    }
  }

  // Mide con todas las secciones abiertas: es la única forma de saber si el
  // menú completo cabe. Lecturas y escrituras ocurren en el mismo frame, así
  // que no se pinta el estado intermedio.
  function syncMode(instant: boolean): void {
    if (!nav) return;
    nav.classList.remove('sidebar__nav--accordion');
    nav.classList.add('sidebar__nav--flat');
    // Mide el menú completo aunque vengamos de un acordeón con secciones
    // cerradas. Sin el modo instantáneo, la transición de `grid-template-rows`
    // aún reportaría el alto anterior.
    if (instant) nav.classList.add('sidebar__nav--instant');
    toggles.forEach((toggle) => setExpanded(toggle, true));
    const fits = nav.scrollHeight <= nav.clientHeight + 2;
    if (fits) {
      applyMode('flat', instant);
      return;
    }
    nav.classList.remove('sidebar__nav--flat');
    nav.classList.add('sidebar__nav--accordion');
    applyMode('accordion', instant);
    fitOpenSections();
  }

  syncMode(true);

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      if (mode !== 'accordion') return;
      const key = keyOf(toggle);
      if (isExpanded(toggle)) closeSection(key);
      else openSection(key);
      fitOpenSections();
      saveSections(openOrder);
    });
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => syncMode(true), 120);
  });
}
