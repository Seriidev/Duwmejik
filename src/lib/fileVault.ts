const DB_NAME = 'duwmejik-files'
const STORE = 'files'

function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export function putFile(id: string, file: Blob) {
  return run('readwrite', (store) => store.put(file, id))
}

export function getFile(id: string) {
  return run<Blob | undefined>('readonly', (store) => store.get(id))
}

export function deleteFile(id: string) {
  return run('readwrite', (store) => store.delete(id))
}
