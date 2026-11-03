// Wheel Swap page: two uploads, two sizes, one request, before/after slider.
const form = document.getElementById('form');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const go = document.getElementById('go');

const ERRORS = {
  no_wheels: 'На фото авто не видно дисків. Сфотографуйте авто збоку або під кутом, щоб колеса було видно.',
  no_rim: 'Не вдалося знайти диск на другому фото. Потрібне фото, де диск видно повністю або хоча б наполовину.',
  rim_cut: 'Диск на другому фото обрізаний: не видно зовнішнього краю обода. Візьміть фото, де диск видно разом з краєм.',
  rim_unclear: 'Не вдалося надійно виділити диск на другому фото. Краще підійде фото диска анфас або на білому фоні.',
  bad_input: 'Перевірте розміри дисків.',
};
const WARNINGS = {
  'the new rim leaves almost no tyre; drawn with the thinnest tyre that still shows':
    'Новий диск занадто великий для цього колеса: шина намальована найтоншою, яка ще можлива.',
};

for (const [name, def] of [['d0', 17], ['d1', 18]]) {
  const sel = form.elements[name];
  for (let d = 13; d <= 24; d++) sel.add(new Option(`${d}″`, d, d === def, d === def));
}

for (const drop of document.querySelectorAll('.drop')) {
  const input = drop.querySelector('input');
  const img = drop.querySelector('img');
  const show = (file) => {
    if (!file) return;
    img.src = URL.createObjectURL(file);
    img.hidden = false;
    drop.classList.add('has-img');
  };
  input.addEventListener('change', () => show(input.files[0]));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      show(input.files[0]);
    }
  });
}

function setStatus(text, kind) {
  statusEl.hidden = !text;
  statusEl.textContent = text || '';
  statusEl.className = kind || '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  go.disabled = true;
  resultEl.hidden = true;
  setStatus('Шукаємо колеса й підганяємо диск… зазвичай 5–20 секунд.', 'busy');
  try {
    const res = await fetch('/api/swap', { method: 'POST', body: data });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) {
      setStatus(ERRORS[body.error] || body.message || `Помилка ${res.status}`, 'err');
      return;
    }
    showResult(body);
    setStatus('');
  } catch (err) {
    setStatus('Сервер недоступний. Спробуйте ще раз.', 'err');
  } finally {
    go.disabled = false;
  }
});

function showResult({ image, report }) {
  document.getElementById('before').src = document.querySelector('[data-for=car] img').src;
  document.getElementById('after').src = image;
  document.getElementById('download').href = image;
  const n = report.wheels.length;
  const words = n === 1 ? 'колесо' : n < 5 ? 'колеса' : 'коліс';
  const notes = report.warnings.map((w) => WARNINGS[w] || w);
  document.getElementById('summary').textContent =
    [`Замінено: ${n} ${words}.`, ...notes, `${report.seconds} с`].join(' ');
  resultEl.hidden = false;
  resultEl.scrollIntoView({ behavior: 'smooth' });
}

const slider = document.getElementById('slider');
const compare = document.getElementById('compare');
slider.addEventListener('input', () => {
  const v = slider.value;
  compare.style.setProperty('--pos', `${v}%`);
  compare.querySelector('.after-wrap').style.clipPath = `inset(0 0 0 ${v}%)`;
});
