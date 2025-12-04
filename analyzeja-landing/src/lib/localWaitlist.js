export function getLocalEmails() {
  try {
    const raw = localStorage.getItem('waitlist_emails')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getLocalCount() {
  return getLocalEmails().length
}

export function addLocalEmail(email) {
  const list = getLocalEmails()
  list.push({ email, at: Date.now() })
  localStorage.setItem('waitlist_emails', JSON.stringify(list))
  dispatchEvent(new CustomEvent('waitlist:update'))
}

export function subscribeLocal(handler) {
  function onUpdate() {
    handler(getLocalCount())
  }
  function onStorage(e) {
    if (e.key === 'waitlist_emails') onUpdate()
  }
  addEventListener('waitlist:update', onUpdate)
  addEventListener('storage', onStorage)
  handler(getLocalCount())
  return () => {
    removeEventListener('waitlist:update', onUpdate)
    removeEventListener('storage', onStorage)
  }
}

export function subscribeLocalList(handler) {
  function onUpdate() {
    handler(getLocalEmails())
  }
  function onStorage(e) {
    if (e.key === 'waitlist_emails') onUpdate()
  }
  addEventListener('waitlist:update', onUpdate)
  addEventListener('storage', onStorage)
  handler(getLocalEmails())
  return () => {
    removeEventListener('waitlist:update', onUpdate)
    removeEventListener('storage', onStorage)
  }
}
