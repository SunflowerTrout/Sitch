
document.getElementById('dropForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('dropInput');
  const text = input.value.trim();
  if (text) {
    const li = document.createElement('li');
    li.textContent = text + ' - [Send KAS Tip]';
    document.getElementById('dropList').appendChild(li);
    input.value = '';
  }
});
