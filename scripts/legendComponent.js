const legendItem = document.createElement('template');

//legendItem.innerHTML = 

class LegendElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
  <div>
    <div class="legendColor"></div>
  </div>
`;
  }
}

customElements.define('legend-item', LegendElement);