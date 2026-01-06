// Lightweight client-side filter for datalist options
(function(){
  function debounce(fn, delay) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    const datalist = document.getElementById("optionsMedicamentos");
    if (!datalist) return; // nothing to do

    const inputIds = ["medicamento1", "medicamento2", "medicamento3", "medicamento"];

    const handler = debounce(function(input) {
      const value = (input.value || '').toLowerCase().trim();
      const options = Array.from(datalist.options);
      options.forEach(option => {
        // Show only if at least 2 characters typed and match ignoring case
        option.hidden = value.length < 2 || !option.value.toLowerCase().includes(value);
      });
    }, 100);

    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function() { handler(this); });
    });
  });
})();
