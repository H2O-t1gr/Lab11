import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const db = createClient('https://ewvszboacoxfdfpgrhan.supabase.co', 'sb_publishable_Tp_XeLqXUQDsIVATVxVVvw_SbK9Tn-B');
const status = document.querySelector('#status');
const list = document.querySelector('#devices');

const search = document.querySelector('#search');
const typeFilter = document.querySelector('#type-filter');
const sort = document.querySelector('#sort');
let devices = [];

function renderDevices() {
  const query = search.value.trim().toLocaleLowerCase('uk');
  const selectedType = typeFilter.value;

  const matches = devices.filter(device =>
    device.name.toLocaleLowerCase('uk').includes(query) &&
    (!selectedType || device.device_type === selectedType)
  );

  if (sort.value === 'name') {
    matches.sort((first, second) =>
      first.name.localeCompare(second.name, 'uk')
    );
  }

  list.replaceChildren();

  for (const device of matches) {
    const item = document.createElement('li');
    item.textContent =
      `${device.name} — ${device.device_type}, ${device.location}`;
    list.append(item);
  }

  if (!devices.length) {
    status.textContent = 'У каталозі поки немає пристроїв.';
  } else if (!matches.length) {
    status.textContent = 'За цим пошуком і фільтром нічого не знайдено.';
  } else {
    status.textContent = `Знайдено пристроїв: ${matches.length}`;
  }
}

async function loadDevices() {
  status.textContent = 'Завантаження…';

  try {
    const { data, error } = await db
      .from('network_devices')
      .select('id, name, device_type, location')
      .order('id');

    if (error) throw error;

    devices = data;
    const previousType = typeFilter.value;
    const types = [...new Set(devices.map(device => device.device_type))]
      .sort((first, second) => first.localeCompare(second, 'uk'));

    typeFilter.replaceChildren(new Option('Усі типи', ''));

    for (const type of types) {
      typeFilter.add(new Option(type, type));
    }

    typeFilter.value = types.includes(previousType) ? previousType : '';
    renderDevices();
    return true;
  } catch (error) {
    console.error(error);
    status.textContent = 'Не вдалося завантажити каталог.';
    return false;
  }
}

search.addEventListener('input', renderDevices);
typeFilter.addEventListener('change', renderDevices);
sort.addEventListener('change', renderDevices);
const form = document.querySelector('#device-form');
const formStatus = document.querySelector('#form-status');
const submitButton = form.querySelector('button');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fields = new FormData(form);
  const device = {
    name: fields.get('name').trim(),
    device_type: fields.get('device_type').trim(),
    location: fields.get('location').trim()
  };

  if (Object.values(device).some(value => !value || value.length > 150)) {
    formStatus.textContent = 'Заповни всі поля. Максимум 150 символів у полі.';
    return;
  }

  submitButton.disabled = true;
  formStatus.textContent = 'Збереження…';

  try {
    const { error } = await db.from('network_devices').insert(device);
    if (error) throw error;

    form.reset();
    const refreshed = await loadDevices();
    formStatus.textContent = refreshed
      ? 'Пристрій збережено.'
      : 'Пристрій збережено. Онови сторінку, щоб побачити його у списку.';
  } catch (error) {
    console.error(error);
    formStatus.textContent = 'Не вдалося зберегти пристрій. Спробуй ще раз.';
  } finally {
    submitButton.disabled = false;
  }
});
loadDevices();