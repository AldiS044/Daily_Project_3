from flask import Flask, render_template, request, jsonify
import json
import os
import uuid
from datetime import datetime, timedelta
import random

app = Flask(__name__)

DATA_FILE = 'data/alumni_data.json'
EVIDENCE_FILE = 'data/evidence_data.json'

def load_data(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_data(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_monitoring_profile(alumni):
    """Step 2: Create Alumni Monitoring Profile"""
    name = alumni['nama']
    name_parts = name.split()
    name_variations = [
        name,
        ' '.join(name_parts[::-1]) if len(name_parts) > 1 else name,
        name_parts[0] if name_parts else name,
        name.lower(),
    ]
    
    field_keywords = {
        'Teknik Informatika': ['software engineer', 'developer', 'programmer', 'data scientist', 'AI engineer'],
        'Manajemen': ['manager', 'business analyst', 'consultant', 'entrepreneur', 'direktur'],
        'Akuntansi': ['akuntan', 'auditor', 'finance manager', 'controller', 'CFO'],
        'Hukum': ['lawyer', 'attorney', 'legal counsel', 'hakim', 'notaris'],
        'Kedokteran': ['dokter', 'physician', 'researcher', 'medical officer', 'spesialis'],
        'Psikologi': ['psikolog', 'counselor', 'HR manager', 'therapist', 'researcher'],
    }

    univ_keywords = ['Universitas Muhammadiyah Malang', 'UMM', 'Muhammadiyah Malang']
    professions = field_keywords.get(alumni.get('program_studi', ''), ['professional', 'specialist'])

    return {
        'name_variations': name_variations,
        'field_keywords': [alumni.get('bidang_keahlian', '')],
        'university_keywords': univ_keywords,
        'possible_professions': professions
    }

def generate_search_queries(alumni, profile):
    """Step 5: Generate Event Queries"""
    name = alumni['nama']
    queries = [
        f'"{name}" "Universitas Muhammadiyah Malang"',
        f'"{name}" published',
        f'"{name}" {alumni.get("bidang_keahlian", "")}',
        f'"{name}" conference',
        f'"{name}" {alumni.get("kota_asal", "")}',
        f'"{name}" LinkedIn',
    ]
    for prof in profile['possible_professions'][:2]:
        queries.append(f'"{name}" "{prof}"')
    return queries

def simulate_event_detection(alumni):
    """Steps 6-8: Detect, Extract, and Validate Events (simulated)"""
    event_types = [
        {'type': 'publikasi_ilmiah', 'label': 'Publikasi Ilmiah', 'icon': '📄', 'color': '#4CAF50'},
        {'type': 'perubahan_pekerjaan', 'label': 'Perubahan Pekerjaan', 'icon': '💼', 'color': '#2196F3'},
        {'type': 'promosi_jabatan', 'label': 'Promosi Jabatan', 'icon': '🚀', 'color': '#9C27B0'},
        {'type': 'keterlibatan_proyek', 'label': 'Keterlibatan Proyek', 'icon': '🔧', 'color': '#FF9800'},
        {'type': 'partisipasi_konferensi', 'label': 'Partisipasi Konferensi', 'icon': '🎤', 'color': '#E91E63'},
        {'type': 'penghargaan', 'label': 'Penghargaan / Berita', 'icon': '🏆', 'color': '#FFD700'},
    ]
    sources = {
        'akademik': ['Google Scholar', 'ORCID', 'ResearchGate'],
        'karier': ['LinkedIn', 'Website Perusahaan', 'Job Portal'],
        'sosial': ['Instagram', 'Facebook', 'Twitter'],
        'teknis': ['GitHub', 'Kaggle'],
        'publik': ['Berita Online', 'Press Release'],
    }
    
    events = []
    tahun_lulus = int(alumni.get('tahun_lulus', 2018))
    for i in range(random.randint(2, 6)):
        ev = random.choice(event_types)
        src_cat = random.choice(list(sources.keys()))
        src = random.choice(sources[src_cat])
        year = tahun_lulus + random.randint(0, datetime.now().year - tahun_lulus)
        month = random.randint(1, 12)
        confidence = round(random.uniform(0.55, 0.99), 2)
        events.append({
            'id': str(uuid.uuid4()),
            'event_type': ev['type'],
            'event_label': ev['label'],
            'event_icon': ev['icon'],
            'event_color': ev['color'],
            'source': src,
            'source_category': src_cat,
            'date': f'{year}-{month:02d}-{random.randint(1,28):02d}',
            'organization': f'Perusahaan / Institusi {random.choice(["A","B","C","D"])}',
            'position': random.choice(['Staff', 'Manager', 'Senior', 'Lead', 'Director', 'Peneliti']),
            'description': f'Aktivitas {ev["label"]} terdeteksi melalui {src}',
            'evidence_url': f'https://example.com/evidence/{uuid.uuid4().hex[:8]}',
            'confidence_score': confidence,
            'found_date': datetime.now().strftime('%Y-%m-%d'),
            'validated': confidence > 0.7,
        })
    events.sort(key=lambda x: x['date'])
    return events

def determine_alumni_status(events):
    """Step 10: Determine Alumni Status"""
    if not events:
        return 'Tidak Teridentifikasi'
    validated = [e for e in events if e['validated']]
    if not validated:
        return 'Perlu Verifikasi'
    academic_events = [e for e in validated if e['event_type'] == 'publikasi_ilmiah']
    career_events = [e for e in validated if e['event_type'] in ['perubahan_pekerjaan', 'promosi_jabatan']]
    if academic_events:
        return 'Aktif Akademik'
    if career_events:
        return 'Aktif Profesional'
    return 'Perlu Verifikasi'

def build_career_timeline(alumni, events):
    """Step 9: Build Career Timeline"""
    timeline = []
    timeline.append({
        'date': f'{alumni["tahun_lulus"]}-07-01',
        'type': 'graduation',
        'label': 'Lulus',
        'description': f'Lulus dari {alumni.get("program_studi","UMM")} - Universitas Muhammadiyah Malang',
        'icon': '🎓',
        'color': '#1976D2'
    })
    for ev in events:
        timeline.append({
            'date': ev['date'],
            'type': ev['event_type'],
            'label': ev['event_label'],
            'description': ev['description'],
            'icon': ev['event_icon'],
            'color': ev['event_color'],
        })
    timeline.sort(key=lambda x: x['date'])
    return timeline

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/alumni', methods=['GET'])
def get_all_alumni():
    alumni_list = load_data(DATA_FILE)
    return jsonify(alumni_list)

@app.route('/api/alumni', methods=['POST'])
def add_alumni():
    data = request.get_json()
    alumni_list = load_data(DATA_FILE)
    
    new_alumni = {
        'id': str(uuid.uuid4()),
        'nama': data.get('nama', ''),
        'program_studi': data.get('program_studi', ''),
        'tahun_lulus': data.get('tahun_lulus', ''),
        'bidang_keahlian': data.get('bidang_keahlian', ''),
        'kota_asal': data.get('kota_asal', ''),
        'status': 'Perlu Verifikasi',
        'last_monitored': None,
        'next_monitor': None,
        'created_at': datetime.now().isoformat(),
        'events': [],
        'timeline': [],
        'profile': {},
        'queries': [],
    }
    
    # Generate profile & queries immediately
    profile = generate_monitoring_profile(new_alumni)
    new_alumni['profile'] = profile
    new_alumni['queries'] = generate_search_queries(new_alumni, profile)
    
    alumni_list.append(new_alumni)
    save_data(DATA_FILE, alumni_list)
    return jsonify(new_alumni), 201

@app.route('/api/alumni/<alumni_id>', methods=['GET'])
def get_alumni(alumni_id):
    alumni_list = load_data(DATA_FILE)
    alumni = next((a for a in alumni_list if a['id'] == alumni_id), None)
    if not alumni:
        return jsonify({'error': 'Alumni not found'}), 404
    return jsonify(alumni)

@app.route('/api/alumni/<alumni_id>', methods=['PUT'])
def update_alumni(alumni_id):
    alumni_list = load_data(DATA_FILE)
    idx = next((i for i, a in enumerate(alumni_list) if a['id'] == alumni_id), None)
    if idx is None:
        return jsonify({'error': 'Alumni not found'}), 404
    data = request.get_json()
    for k, v in data.items():
        alumni_list[idx][k] = v
    save_data(DATA_FILE, alumni_list)
    return jsonify(alumni_list[idx])

@app.route('/api/alumni/<alumni_id>', methods=['DELETE'])
def delete_alumni(alumni_id):
    alumni_list = load_data(DATA_FILE)
    alumni_list = [a for a in alumni_list if a['id'] != alumni_id]
    save_data(DATA_FILE, alumni_list)
    return jsonify({'success': True})

@app.route('/api/alumni/<alumni_id>/monitor', methods=['POST'])
def run_monitoring(alumni_id):
    """Run full monitoring cycle for one alumni"""
    alumni_list = load_data(DATA_FILE)
    idx = next((i for i, a in enumerate(alumni_list) if a['id'] == alumni_id), None)
    if idx is None:
        return jsonify({'error': 'Alumni not found'}), 404

    alumni = alumni_list[idx]
    
    # Steps 2-8
    profile = generate_monitoring_profile(alumni)
    queries = generate_search_queries(alumni, profile)
    events = simulate_event_detection(alumni)
    status = determine_alumni_status(events)
    timeline = build_career_timeline(alumni, events)
    
    # Steps 9-12
    alumni['profile'] = profile
    alumni['queries'] = queries
    alumni['events'] = events
    alumni['timeline'] = timeline
    alumni['status'] = status
    alumni['last_monitored'] = datetime.now().isoformat()
    alumni['next_monitor'] = (datetime.now() + timedelta(days=90)).isoformat()
    
    alumni_list[idx] = alumni
    save_data(DATA_FILE, alumni_list)
    return jsonify(alumni)

@app.route('/api/monitor/all', methods=['POST'])
def run_all_monitoring():
    """Run monitoring for all alumni"""
    alumni_list = load_data(DATA_FILE)
    results = []
    for i, alumni in enumerate(alumni_list):
        profile = generate_monitoring_profile(alumni)
        queries = generate_search_queries(alumni, profile)
        events = simulate_event_detection(alumni)
        status = determine_alumni_status(events)
        timeline = build_career_timeline(alumni, events)
        
        alumni_list[i]['profile'] = profile
        alumni_list[i]['queries'] = queries
        alumni_list[i]['events'] = events
        alumni_list[i]['timeline'] = timeline
        alumni_list[i]['status'] = status
        alumni_list[i]['last_monitored'] = datetime.now().isoformat()
        alumni_list[i]['next_monitor'] = (datetime.now() + timedelta(days=90)).isoformat()
        results.append({'id': alumni['id'], 'nama': alumni['nama'], 'status': status})
    
    save_data(DATA_FILE, alumni_list)
    return jsonify({'monitored': len(results), 'results': results})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    alumni_list = load_data(DATA_FILE)
    total = len(alumni_list)
    statuses = {}
    program_studi = {}
    events_total = 0
    for a in alumni_list:
        s = a.get('status', 'Perlu Verifikasi')
        statuses[s] = statuses.get(s, 0) + 1
        ps = a.get('program_studi', 'Lainnya')
        program_studi[ps] = program_studi.get(ps, 0) + 1
        events_total += len(a.get('events', []))
    
    return jsonify({
        'total': total,
        'statuses': statuses,
        'program_studi': program_studi,
        'events_total': events_total,
        'monitored': sum(1 for a in alumni_list if a.get('last_monitored')),
    })

@app.route('/api/seed', methods=['POST'])
def seed_data():
    """Seed sample alumni data"""
    sample_alumni = [
        {'nama': 'Ahmad Fauzi Ramadan', 'program_studi': 'Teknik Informatika', 'tahun_lulus': '2019', 'bidang_keahlian': 'Machine Learning', 'kota_asal': 'Malang'},
        {'nama': 'Siti Nurhaliza Putri', 'program_studi': 'Manajemen', 'tahun_lulus': '2020', 'bidang_keahlian': 'Digital Marketing', 'kota_asal': 'Surabaya'},
        {'nama': 'Budi Santoso Wijaya', 'program_studi': 'Akuntansi', 'tahun_lulus': '2018', 'bidang_keahlian': 'Audit & Keuangan', 'kota_asal': 'Jakarta'},
        {'nama': 'Dewi Anggraini', 'program_studi': 'Psikologi', 'tahun_lulus': '2021', 'bidang_keahlian': 'HR & Rekrutmen', 'kota_asal': 'Bandung'},
        {'nama': 'Rizky Pratama Nugroho', 'program_studi': 'Teknik Informatika', 'tahun_lulus': '2017', 'bidang_keahlian': 'Backend Engineering', 'kota_asal': 'Yogyakarta'},
        {'nama': 'Ika Wahyu Lestari', 'program_studi': 'Hukum', 'tahun_lulus': '2019', 'bidang_keahlian': 'Hukum Bisnis', 'kota_asal': 'Malang'},
        {'nama': 'Muhammad Arif Hidayat', 'program_studi': 'Teknik Informatika', 'tahun_lulus': '2022', 'bidang_keahlian': 'Mobile Development', 'kota_asal': 'Batu'},
        {'nama': 'Yunita Sari Dewi', 'program_studi': 'Manajemen', 'tahun_lulus': '2020', 'bidang_keahlian': 'Operasional & Logistik', 'kota_asal': 'Kediri'},
    ]
    alumni_list = []
    for s in sample_alumni:
        a = {
            'id': str(uuid.uuid4()),
            **s,
            'status': 'Perlu Verifikasi',
            'last_monitored': None,
            'next_monitor': None,
            'created_at': datetime.now().isoformat(),
            'events': [],
            'timeline': [],
            'profile': {},
            'queries': [],
        }
        profile = generate_monitoring_profile(a)
        a['profile'] = profile
        a['queries'] = generate_search_queries(a, profile)
        alumni_list.append(a)
    
    save_data(DATA_FILE, alumni_list)
    return jsonify({'seeded': len(alumni_list)})

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    app.run(debug=True, port=5000)
