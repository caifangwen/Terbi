document.querySelectorAll('.tqa').forEach((root) => {
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  const search = root.querySelector('.tqa__search');
  const suggestions = root.querySelector('.tqa__suggestions');
  const sort = root.querySelector('.tqa__sort');
  const results = root.querySelector('.tqa__results');
  const empty = root.querySelector('.tqa__empty');
  const noResults = root.querySelector('.tqa__no-results');
  const visibleCount = root.querySelector('.tqa__visible-count');
  const countLabel = root.querySelector('.tqa__count-label');
  const askButton = root.querySelector('.tqa__ask-button');
  const modal = root.querySelector('.tqa__modal');
  const form = root.querySelector('.tqa__form');
  const formMessage = root.querySelector('.tqa__form-message');
  const submit = root.querySelector('.tqa__submit');
  const apiUrl = root.dataset.apiUrl;
  const turnstileSiteKey = root.dataset.turnstileSiteKey;
  const startedAt = Date.now();

  let turnstileWidgetId = null;

  function items(){
    return Array.from(root.querySelectorAll('.tqa__item'));
  }

  function normalized(value){
    return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function updateCount(count){
    visibleCount.textContent = count;
    countLabel.textContent = count === 1 ? 'Question' : 'Questions';
  }

  function filterQuestions(){
    const q = normalized(search.value);
    let shown = 0;

    items().forEach(item => {
      const haystack = normalized(
        (item.dataset.question || '') + ' ' + (item.dataset.answer || '')
      );
      const match = !q || haystack.includes(q);
      item.hidden = !match;
      if (match) shown += 1;
    });

    updateCount(shown);

    if (empty) {
      empty.hidden = items().length > 0;
    }
    noResults.hidden = !(items().length > 0 && shown === 0);

    renderSuggestions(q);
  }

  function renderSuggestions(q){
    suggestions.innerHTML = '';

    if (q.length < 2) {
      suggestions.hidden = true;
      return;
    }

    const matches = items()
      .filter(item => normalized(item.dataset.question).includes(q))
      .slice(0, 5);

    if (!matches.length) {
      suggestions.hidden = true;
      return;
    }

    matches.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tqa__suggestion';
      button.textContent = item.dataset.question;
      button.addEventListener('click', () => {
        search.value = item.dataset.question;
        suggestions.hidden = true;
        filterQuestions();
        item.hidden = false;
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      suggestions.appendChild(button);
    });

    suggestions.hidden = false;
  }

  function sortQuestions(){
    const mode = sort.value;
    const list = items();

    list.sort((a,b) => {
      if (mode === 'az') {
        return (a.dataset.question || '').localeCompare(b.dataset.question || '');
      }

      const aDate = Date.parse(a.dataset.date || '') || 0;
      const bDate = Date.parse(b.dataset.date || '') || 0;
      return mode === 'oldest' ? aDate - bDate : bDate - aDate;
    });

    list.forEach(item => results.insertBefore(item, empty || noResults));
    filterQuestions();
  }

  function openModal(){
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    formMessage.textContent = '';
    formMessage.className = 'tqa__form-message';
    setTimeout(() => form.querySelector('[name="customer_name"]')?.focus(), 40);
    ensureTurnstile();
  }

  function closeModal(){
    modal.hidden = true;
    document.documentElement.style.overflow = '';
  }

  function ensureTurnstile(){
    if (!turnstileSiteKey || turnstileWidgetId !== null) return;

    const container = root.querySelector('.tqa__turnstile');
    if (!container) return;

    const render = () => {
      if (!window.turnstile || turnstileWidgetId !== null) return;
      turnstileWidgetId = window.turnstile.render(container, {
        sitekey: turnstileSiteKey
      });
    };

    if (window.turnstile) {
      render();
      return;
    }

    if (!document.querySelector('script[data-terkkin-turnstile]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.terkkinTurnstile = 'true';
      script.onload = render;
      document.head.appendChild(script);
    } else {
      const timer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(timer);
          render();
        }
      }, 100);
      setTimeout(() => clearInterval(timer), 8000);
    }
  }

  search?.addEventListener('input', filterQuestions);
  sort?.addEventListener('change', sortQuestions);
  askButton?.addEventListener('click', openModal);

  root.querySelectorAll('[data-tqa-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  document.addEventListener('click', event => {
    if (!root.contains(event.target)) suggestions.hidden = true;
  });

  form?.addEventListener('submit', async event => {
    event.preventDefault();

    formMessage.textContent = '';
    formMessage.className = 'tqa__form-message';

    if (!apiUrl || apiUrl.includes('YOUR-WORKER')) {
      formMessage.textContent = 'Questions API is not configured yet.';
      formMessage.classList.add('is-error');
      return;
    }

    const data = new FormData(form);
    const payload = {
      product_id: root.dataset.productId,
      product_handle: root.dataset.productHandle,
      source_url: root.dataset.productUrl,
      customer_name: String(data.get('customer_name') || ''),
      customer_email: String(data.get('customer_email') || ''),
      question: String(data.get('question') || ''),
      website: String(data.get('website') || ''),
      started_at: startedAt,
      turnstile_token: ''
    };

    if (turnstileSiteKey) {
      payload.turnstile_token = String(data.get('cf-turnstile-response') || '');
      if (!payload.turnstile_token) {
        formMessage.textContent = 'Please complete the verification.';
        formMessage.classList.add('is-error');
        return;
      }
    }

    submit.disabled = true;
    submit.textContent = 'Submitting…';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });

      let json = {};
      try { json = await response.json(); } catch(e) {}

      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Unable to submit your question.');
      }

      form.reset();
      formMessage.textContent = json.message || 'Your question has been submitted for review.';
      formMessage.classList.add('is-success');

      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }

      setTimeout(closeModal, 1800);
    } catch(error) {
      formMessage.textContent = error.message || 'Unable to submit your question.';
      formMessage.classList.add('is-error');
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } finally {
      submit.disabled = false;
      submit.textContent = 'Submit question';
    }
  });

  sortQuestions();
});
