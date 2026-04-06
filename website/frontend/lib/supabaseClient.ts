import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// FORCE FALSE for AyuLink Expo (Always use local JSON DB and local storage)
export const isSupabaseConfigured = false 

// Updated mock client that uses local Next API routes instead of memory
const mockSupabase = {
    from: (table: string) => {
        let _eqCol: string | null = null;
        let _eqVal: any = null;

        const chain = {
            select: () => chain,
            order: () => chain,
            limit: () => chain,
            eq: (col: string, val: any) => {
                _eqCol = col;
                _eqVal = val;
                return chain;
            },
            insert: async (data: any) => {
                const res = await fetch('/api/local-db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table, action: 'insert', data, eqCol: _eqCol, eqVal: _eqVal })
                });
                return await res.json();
            },
            update: async (data: any) => {
                const res = await fetch('/api/local-db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table, action: 'update', data, eqCol: _eqCol, eqVal: _eqVal })
                });
                return await res.json();
            },
            delete: () => {
                const deleteChain = {
                    eq: async (col: string, val: any) => {
                        const res = await fetch('/api/local-db', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ table, action: 'delete', eqCol: col, eqVal: val })
                        });
                        return await res.json();
                    }
                }
                return deleteChain;
            },
            // Allow awaiting the chain (for select statements)
            then: (onfulfilled: any, onrejected: any) => {
                let url = `/api/local-db?table=${table}`;
                if (_eqCol && _eqVal !== null) {
                    url += `&eqCol=${encodeURIComponent(_eqCol)}&eqVal=${encodeURIComponent(_eqVal)}`;
                }

                // SSR Fix: Next.js cannot fetch relative URLs during Server Side Rendering
                if (typeof window === 'undefined') {
                    const host = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                    url = `${host}${url}`;
                }

                // Make sure we only catch FETCH errors, and pass the explicit DB response to the caller
                return fetch(url)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                        return res.json();
                    })
                    .catch(err => {
                        console.error('[Mock Supabase Fetch Error]', err);
                        return { data: [], error: { message: err.message } };
                    })
                    .then(onfulfilled, onrejected);
            }
        }
        return chain
    },
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: any) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('filename', path);
                formData.append('bucket', bucket);

                try {
                    const res = await fetch('/api/local-storage', {
                        method: 'POST',
                        body: formData
                    });
                    return await res.json();
                } catch (err) {
                    console.error('Local storage upload err', err);
                    return { error: err };
                }
            },
            getPublicUrl: (path: string) => {
                // Return local endpoint
                return { data: { publicUrl: `/uploads/${path}` } }
            },
            remove: async (paths: string[]) => {
                return Promise.resolve({ data: [], error: null })
            }
        })
    },
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
    channel: (name: string) => {
        const channelObj = {
            on: (type: string, filter: any, callback: any) => {
                const handler = (e: any) => {
                    if (e.detail.name === name && e.detail.event === filter.event) {
                        callback(e.detail.payload)
                    }
                }
                if (typeof window !== 'undefined') {
                    window.addEventListener('supabase-mock-broadcast', handler)
                }
                return channelObj
            },
            subscribe: () => channelObj,
            unsubscribe: () => { },
            send: (payload: any) => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('supabase-mock-broadcast', {
                        detail: { name, event: payload.event, payload }
                    }))
                }
                return Promise.resolve('ok')
            }
        }
        return channelObj
    },
    removeChannel: () => Promise.resolve(),
}

// Export real client if configured, otherwise mock
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : mockSupabase as any

// Helper to check if we are using the real backend
export const isSupabaseLive = !!isSupabaseConfigured
