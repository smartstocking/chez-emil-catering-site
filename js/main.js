(function(){
  "use strict";

  /* ---------- Language switching ---------- */
  const STORAGE_KEY = 'chezemil-lang';
  const deTexts = {}; // cache original German text per element (first run)
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'de';

  function captureOriginals(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      deTexts[key] = { html: el.innerHTML, isOption: el.tagName === 'OPTION' };
    });
  }

  function applyLang(lang){
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(lang === 'de'){
        el.innerHTML = deTexts[key] ? deTexts[key].html : el.innerHTML;
      } else {
        const dict = TRANSLATIONS[lang];
        if(dict && dict[key] !== undefined){
          el.innerHTML = dict[key];
        }
      }
    });
    document.querySelectorAll('.lang-btn').forEach(btn=>{
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }

  document.addEventListener('DOMContentLoaded', function(){
    captureOriginals();
    applyLang(currentLang);

    document.querySelectorAll('.lang-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> applyLang(btn.getAttribute('data-lang')));
    });

    /* ---------- Mobile menu ---------- */
    const burger = document.getElementById('burgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    if(burger && mobileNav){
      burger.addEventListener('click', ()=>{
        mobileNav.classList.toggle('open');
      });
      mobileNav.querySelectorAll('a').forEach(a=>{
        a.addEventListener('click', ()=> mobileNav.classList.remove('open'));
      });
    }

    /* ---------- Quick order buttons ----------
       "Commander" buttons on directly-orderable offer cards (data-order-item)
       pre-fill the contact form's message + request type, then scroll to it,
       instead of pretending to run a real checkout/payment flow. */
    const ORDER_OPTION_LABEL = {
      de: 'Direktbestellung (Sortiment)',
      en: 'Direct order (from our range)',
      fr: 'Commande directe (sortiment)'
    };
    const ORDER_MESSAGE_PREFIX = {
      de: 'Ich möchte gerne bestellen: ',
      en: 'I would like to order: ',
      fr: 'Je souhaite commander : '
    };
    document.querySelectorAll('.btn-order').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const item = btn.getAttribute('data-order-item') || '';
        const select = document.getElementById('requestType');
        const message = document.getElementById('messageField');
        const msgs = ORDER_MESSAGE_PREFIX[currentLang] || ORDER_MESSAGE_PREFIX.de;
        const optLabel = ORDER_OPTION_LABEL[currentLang] || ORDER_OPTION_LABEL.de;

        if(select){
          const opt = Array.from(select.options).find(o => o.textContent.trim() === optLabel);
          if(opt) select.value = opt.value;
        }
        if(message){
          message.value = msgs + item + ' — ';
        }
        const target = document.getElementById('anfragen');
        if(target) target.scrollIntoView({ behavior: 'smooth' });
        if(message){
          setTimeout(()=>{ message.focus(); message.setSelectionRange(message.value.length, message.value.length); }, 400);
        }
      });
    });

    /* ---------- Contact form -> Formspree ----------
       Submitted via fetch() straight to Formspree so the request reaches us
       reliably, regardless of whether the visitor has an email client
       configured. */
    const FORM_MESSAGES = {
      de: {
        sending: 'Wird gesendet…',
        success: 'Danke! Ihre Anfrage wurde erfolgreich versendet. Wir melden uns innerhalb von 24 Stunden.',
        error: 'Es gab ein Problem beim Senden. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an chezemil.reservations@gmail.com.'
      },
      en: {
        sending: 'Sending…',
        success: 'Thank you! Your request has been sent successfully. We’ll get back to you within 24 hours.',
        error: 'Something went wrong while sending. Please try again or email us directly at chezemil.reservations@gmail.com.'
      },
      fr: {
        sending: 'Envoi en cours…',
        success: 'Merci ! Votre demande a bien été envoyée. Nous vous répondons sous 24 heures.',
        error: 'Une erreur est survenue lors de l’envoi. Merci de réessayer ou de nous écrire directement à chezemil.reservations@gmail.com.'
      }
    };

    const form = document.getElementById('contactForm');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const statusEl = document.getElementById('formStatus');
        const msgs = FORM_MESSAGES[currentLang] || FORM_MESSAGES.de;
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = msgs.sending;
        statusEl.hidden = true;
        statusEl.classList.remove('form-status--error', 'form-status--success');

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function(response){
          if(!response.ok){ throw new Error('Form submission failed'); }
          form.reset();
          statusEl.textContent = msgs.success;
          statusEl.classList.add('form-status--success');
          statusEl.hidden = false;
        }).catch(function(){
          statusEl.textContent = msgs.error;
          statusEl.classList.add('form-status--error');
          statusEl.hidden = false;
        }).finally(function(){
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        });
      });
    }
  });
})();
