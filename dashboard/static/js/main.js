document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById('progressChart');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Water', 'Reading', 'Steps'],
        datasets: [{
          label: 'Completion %',
          data: [70, 50, 90],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }
});
