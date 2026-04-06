import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

function getDb() {
    try {
        if (!fs.existsSync(dbPath)) {
            const initialData = { 
                patients: [], 
                vitals: [], 
                patient_records: [], 
                asha_visits: [], 
                appointments: [], 
                commands: [] 
            };
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const content = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(content || '{}');
    } catch (e) {
        console.error('[API] Error reading DB:', e);
        return { patients: [], vitals: [], patient_records: [], asha_visits: [], appointments: [], commands: [] };
    }
}

function saveDb(data: any) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('[API] Error saving DB:', e);
        return false;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const eqCol = searchParams.get('eqCol');
    const eqVal = searchParams.get('eqVal');

    if (!table) return NextResponse.json({ error: 'table required' }, { status: 400 });

    const db = getDb();
    let data = db[table] || [];

    if (eqCol && eqVal) {
        data = data.filter((item: any) => item[eqCol] == eqVal);
    }

    // Enhance patient records with their latest vitals for the UI
    if (table === 'patients') {
        const vitals = db.vitals || [];
        data = data.map((patient: any) => {
            const patientVitals = vitals.filter((v: any) => v.patient_id === patient.id);
            const latestVital = patientVitals.length > 0 
                ? patientVitals.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                : null;
                
            return {
                ...patient,
                lastVitals: latestVital ? {
                    hr: latestVital.heart_rate,
                    spo2: latestVital.spo2,
                    temp: latestVital.temperature,
                    timestamp: latestVital.timestamp
                } : null,
                vitals: patientVitals // Keep the full history too
            };
        });
    }

    return NextResponse.json({ data, error: null });
}

export async function POST(request: Request) {
    const body = await request.json();
    const { table, action, data: payload, eqCol, eqVal } = body;
    
    console.log(`[API POST] ${action} on ${table}`, payload ? '(with payload)' : '');

    if (!table || !action) {
        return NextResponse.json({ error: 'table and action required' }, { status: 400 });
    }

    const db = getDb();
    if (!db[table]) db[table] = [];

    let resultData: any = [];

    if (action === 'insert') {
        const rows = Array.isArray(payload) ? payload : [payload];
        const recordsWithId = rows.map((r: any) => ({
            id: r.id || Math.random().toString(36).substr(2, 9),
            created_at: r.created_at || new Date().toISOString(),
            ...r
        }));
        db[table].push(...recordsWithId);
        saveDb(db);
        resultData = recordsWithId;
        console.log(`[API] Inserted ${recordsWithId.length} records into ${table}`);
    } else if (action === 'update') {
        db[table] = db[table].map((item: any) => {
            if (eqCol && eqVal && item[eqCol] == eqVal) {
                const updated = { ...item, ...payload };
                resultData.push(updated);
                return updated;
            }
            if (!eqCol && item.id === payload.id) {
                const updated = { ...item, ...payload };
                resultData.push(updated);
                return updated;
            }
            return item;
        });
        saveDb(db);
        console.log(`[API] Updated records in ${table}`);
    } else if (action === 'delete') {
        if (eqCol && eqVal) {
            db[table] = db[table].filter((item: any) => item[eqCol] != eqVal);
            saveDb(db);
            console.log(`[API] Deleted records from ${table} where ${eqCol}=${eqVal}`);
        } else if (payload && payload.id) {
            db[table] = db[table].filter((item: any) => item.id !== payload.id);
            saveDb(db);
            console.log(`[API] Deleted record from ${table} with id ${payload.id}`);
        }
    }

    return NextResponse.json({ data: resultData, error: null });
}
