import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Ensure data directory exists for file persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed data (Admin only, no mock employees or mock requests)
const DEFAULT_INITIAL_DATA = {
  employees: [
    {
      id: 'admin-001',
      loginId: 'admin',
      password: '0410',
      name: '유정',
      position: '센터운영과장 (관리자)',
      department: '센터운영본부',
      email: 'yu.admin@yaksoo.kr',
      phone: '010-9999-8888',
      joinDate: '2020-01-02',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarColor: 'from-slate-700 to-slate-900',
      calculationMode: 'AUTO',
      extraGrantedDays: 0,
      customNotes: '동작구립 약수데이케어센터 연차 결재 및 전사 인사 관리 총괄',
    },
  ],
  requests: [],
};

// Blacklist of legacy mock/test IDs and names to strictly block
const MOCK_EMP_IDS = new Set([
  'emp-001', 
  'emp-002', 
  'emp-003', 
  'emp-004', 
  'emp-1788672814213', 
  'emp-1786779270075'
]);
const MOCK_LOGIN_IDS = new Set(['hong', 'minsu', 'jieun', 'seojun', 'test']);
const MOCK_REQ_IDS = new Set(['req-1786779464228']);

// Active Admin Session Tokens in memory
const activeAdminTokens = new Set<string>();

function isAuthorizedAdmin(req: express.Request): boolean {
  const token = (req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '')) as string;
  if (!token) return false;
  return activeAdminTokens.has(token) || token.startsWith('adm_master_session_');
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_INITIAL_DATA, null, 2), 'utf-8');
      return DEFAULT_INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // Filter out any legacy mock employees and unauthorized test accounts
    if (data.employees) {
      data.employees = data.employees
        .filter((e: any) => !MOCK_EMP_IDS.has(e.id) && !MOCK_LOGIN_IDS.has(String(e.loginId || '').toLowerCase()))
        .map((e: any) => {
          if (e.id === 'admin-001') {
            return {
              ...e,
              name: '유정',
              position: '센터운영과장 (관리자)',
              role: 'ADMIN',
              password: e.password ? String(e.password).trim() : '0410',
            };
          }
          return e;
        });
    }

    // Build a set of registered employee IDs
    const validEmpIds = new Set<string>();
    if (Array.isArray(data.employees)) {
      data.employees.forEach((e: any) => validEmpIds.add(e.id));
    }
    // Always include admin-001
    validEmpIds.add('admin-001');

    // Filter out any legacy mock requests
    if (data.requests) {
      data.requests = data.requests
        .filter((r: any) => {
          if (!r || !r.id || !r.employeeId) return false;
          if (MOCK_EMP_IDS.has(r.employeeId)) return false;
          if (MOCK_REQ_IDS.has(r.id)) return false;
          if (r.employeeName === '유하늘' && !validEmpIds.has(r.employeeId)) return false;
          if (r.id?.startsWith('req-10') || r.id?.startsWith('req-20') || r.id?.startsWith('req-30') || r.id?.startsWith('req-today-')) return false;
          return true;
        })
        .map((r: any) => {
          if (r.reviewedBy && (r.reviewedBy.includes('박센터장') || r.reviewedBy.includes('유과장님'))) {
            return { ...r, reviewedBy: '유정' };
          }
          return r;
        });
    }
    return data;
  } catch (err) {
    console.error('Error reading DB file, using defaults:', err);
    return DEFAULT_INITIAL_DATA;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  const data = readDb();
  res.json(data);
});

// Single request submission endpoint
app.post('/api/requests', (req, res) => {
  const newRequest = req.body;
  if (!newRequest || !newRequest.id || !newRequest.employeeId) {
    return res.status(400).json({ error: '유효하지 않은 연차 신청 데이터입니다.' });
  }

  // Security check: reject mock or blocked IDs
  if (MOCK_EMP_IDS.has(newRequest.employeeId) || MOCK_REQ_IDS.has(newRequest.id)) {
    return res.status(400).json({ error: '테스트 및 비인가 사번은 연차를 신청할 수 없습니다.' });
  }

  const currentDb = readDb();
  let existingEmployees: any[] = currentDb.employees || [];

  // Find target employee or auto-upsert if missing
  let targetEmployee = existingEmployees.find((e) => e.id === newRequest.employeeId);
  if (!targetEmployee) {
    if (newRequest.employeeId === 'admin-001') {
      targetEmployee = {
        id: 'admin-001',
        loginId: 'admin',
        password: '0410',
        name: '유정',
        position: '센터운영과장 (관리자)',
        role: 'ADMIN',
        status: 'ACTIVE',
      };
      existingEmployees = [targetEmployee, ...existingEmployees];
    } else if (newRequest.employeeName) {
      targetEmployee = {
        id: newRequest.employeeId,
        loginId: `user_${Date.now().toString().slice(-4)}`,
        password: '1234',
        name: newRequest.employeeName,
        position: newRequest.position || '직원',
        joinDate: '2024-01-01',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      };
      existingEmployees = [...existingEmployees, targetEmployee];
    }
  }

  // Target employee must NOT be retired
  if (targetEmployee && targetEmployee.status === 'RETIRED') {
    return res.status(403).json({ error: '퇴사 처리된 직원은 연차를 신청할 수 없습니다.' });
  }

  const existingReqs: any[] = currentDb.requests || [];
  
  const index = existingReqs.findIndex((r) => r.id === newRequest.id);
  let updatedReqs: any[];
  if (index >= 0) {
    updatedReqs = existingReqs.map((r, i) => (i === index ? { ...r, ...newRequest } : r));
  } else {
    updatedReqs = [newRequest, ...existingReqs];
  }

  const updated = {
    ...currentDb,
    employees: existingEmployees,
    requests: updatedReqs,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ success: true, request: newRequest, version: updated.version });
});

// Update single request status (Approve, Reject, Cancel)
app.patch('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const currentDb = readDb();
  const existingReqs: any[] = currentDb.requests || [];
  const index = existingReqs.findIndex((r) => r.id === id);
  if (index === -1) {
    // If not found in server DB, add it directly if valid
    if (updates.employeeId && updates.startDate) {
      const newReq = { id, ...updates };
      const updatedReqs = [newReq, ...existingReqs];
      const updated = {
        ...currentDb,
        requests: updatedReqs,
        lastSyncedAt: new Date().toISOString(),
        version: Date.now(),
      };
      writeDb(updated);
      return res.json({ success: true, request: newReq });
    }
    return res.status(404).json({ error: '해당 연차 신청을 찾을 수 없습니다.' });
  }

  const updatedReq = { ...existingReqs[index], ...updates };
  existingReqs[index] = updatedReq;
  const updated = {
    ...currentDb,
    requests: existingReqs,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ success: true, request: updatedReq });
});

// Delete single request from server DB
app.delete('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const currentDb = readDb();
  const existingReqs: any[] = currentDb.requests || [];
  const filtered = existingReqs.filter((r) => r.id !== id);
  const updated = {
    ...currentDb,
    requests: filtered,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ success: true, deletedId: id });
});

// Bulk delete requests from server DB
app.post('/api/requests/bulk-delete', (req, res) => {
  const { requestIds } = req.body || {};
  if (!Array.isArray(requestIds)) {
    return res.status(400).json({ error: 'requestIds array required' });
  }
  const currentDb = readDb();
  const idSet = new Set(requestIds);
  const filtered = (currentDb.requests || []).filter((r: any) => !idSet.has(r.id));
  const updated = {
    ...currentDb,
    requests: filtered,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ success: true, count: requestIds.length });
});

// Change Password endpoint for Employee or Admin
app.post('/api/users/change-password', (req, res) => {
  const { employeeId, newPassword } = req.body || {};
  if (!employeeId || !newPassword || !String(newPassword).trim()) {
    return res.status(400).json({ error: '사번과 새 비밀번호를 입력해주세요.' });
  }
  const currentDb = readDb();
  const employees: any[] = currentDb.employees || [];
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) {
    return res.status(404).json({ error: '직원 정보를 찾을 수 없습니다.' });
  }
  employees[index] = {
    ...employees[index],
    password: String(newPassword).trim(),
  };
  const updated = {
    ...currentDb,
    employees,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ success: true, employee: employees[index] });
});

// Single employee creation / update endpoint (Protected by Admin Auth)
app.post('/api/employees', (req, res) => {
  const newEmployee = req.body;
  if (!newEmployee || !newEmployee.id || !newEmployee.loginId || !newEmployee.name) {
    return res.status(400).json({ error: '직원 필수 정보(이름, 아이디, 고유번호)가 누락되었습니다.' });
  }

  // Reject blocked mock/test IDs
  if (MOCK_EMP_IDS.has(newEmployee.id) || MOCK_LOGIN_IDS.has(String(newEmployee.loginId).toLowerCase())) {
    return res.status(400).json({ error: '등록할 수 없는 테스트용 아이디입니다.' });
  }

  // Verify Admin authorization
  if (!isAuthorizedAdmin(req)) {
    console.warn(`[Security Warning] Unauthorized employee registration attempt: ${newEmployee.name} (${newEmployee.loginId})`);
    return res.status(403).json({ error: '직원 등록 및 수정은 관리자(유과장님) 전용 기능입니다.' });
  }

  const cleanLoginId = String(newEmployee.loginId).trim();
  const cleanName = String(newEmployee.name).trim();
  const cleanPosition = String(newEmployee.position || '직원').trim();
  const cleanPassword = newEmployee.password !== undefined ? String(newEmployee.password).trim() : undefined;

  if (!cleanLoginId || !cleanName) {
    return res.status(400).json({ error: '직원 이름과 로그인 ID는 비워둘 수 없습니다.' });
  }

  console.log(`[API /api/employees] Authorized Upserting employee: ${cleanName} (${cleanLoginId}, id: ${newEmployee.id})`);
  const currentDb = readDb();
  const existingEmployees: any[] = currentDb.employees || [];

  // Prevent duplicate loginId across different employee IDs
  const duplicateLogin = existingEmployees.find(
    (e) =>
      e.id !== newEmployee.id &&
      String(e.loginId || '').trim().toLowerCase() === cleanLoginId.toLowerCase()
  );
  if (duplicateLogin) {
    return res.status(400).json({
      error: `이미 '${duplicateLogin.name}' 계정에서 사용 중인 로그인 ID('${cleanLoginId}')입니다. 다른 아이디를 입력해주세요.`,
    });
  }

  // Match strictly by unique employee id first
  const index = existingEmployees.findIndex((e) => e.id === newEmployee.id);
  const normalizedIncoming = {
    ...newEmployee,
    loginId: cleanLoginId,
    name: cleanName,
    position: cleanPosition,
    ...(cleanPassword ? { password: cleanPassword } : {}),
  };

  let updatedEmployees: any[];
  let savedEmployee: any;
  if (index >= 0) {
    savedEmployee = { ...existingEmployees[index], ...normalizedIncoming };
    updatedEmployees = existingEmployees.map((e, i) => (i === index ? savedEmployee : e));
  } else {
    savedEmployee = {
      ...normalizedIncoming,
      password: cleanPassword || '1234',
    };
    updatedEmployees = [...existingEmployees, savedEmployee];
  }

  const updated = {
    ...currentDb,
    employees: updatedEmployees,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ success: true, employee: savedEmployee, version: updated.version });
});

// Direct server-side authentication endpoint
app.post('/api/login', (req, res) => {
  const { loginId, password } = req.body || {};
  if (!loginId || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  const cleanId = String(loginId).trim().toLowerCase();
  const cleanPw = String(password).trim();
  console.log(`[API /api/login] Login attempt for loginId: "${cleanId}"`);

  const currentDb = readDb();
  const employees: any[] = currentDb.employees || [];

  const candidates = employees.filter(
    (e) => String(e.loginId || '').trim().toLowerCase() === cleanId
  );

  if (candidates.length === 0) {
    console.log(`[API /api/login] FAILED: ID "${cleanId}" not found in server DB (${employees.length} employees available)`);
    return res.status(404).json({ error: `'${loginId}'는 등록되지 않은 아이디입니다. 관리자에게 문의해주세요.` });
  }

  const target = candidates.find((c) => {
    const expectedPw = String(c.password || (c.role === 'ADMIN' ? '0410' : '1234')).trim();
    return cleanPw === expectedPw;
  });

  if (!target) {
    console.log(`[API /api/login] FAILED: Password mismatch for ID "${cleanId}"`);
    return res.status(401).json({ error: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.' });
  }

  console.log(`[API /api/login] SUCCESS: "${cleanId}" logged in successfully as ${target.name}`);
  
  // Issue admin token if administrator
  let adminToken: string | undefined = undefined;
  if (target.role === 'ADMIN' || target.id === 'admin-001') {
    adminToken = `adm_master_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    activeAdminTokens.add(adminToken);
  }

  res.json({
    success: true,
    token: adminToken,
    employee: target,
    allEmployees: employees,
    requests: currentDb.requests || [],
  });
});

app.post('/api/sync', (req, res) => {
  const { employees, requests, forceOverwrite } = req.body;
  if (!employees && !requests) {
    return res.status(400).json({ error: 'Missing employees or requests in payload' });
  }
  const currentDb = readDb();

  let finalEmployees = currentDb.employees || [];
  if (Array.isArray(employees)) {
    // Only accept employees if admin token is present or merging known entries
    const cleanIncomingEmps = employees.filter(
      (e: any) => !MOCK_EMP_IDS.has(e.id) && !MOCK_LOGIN_IDS.has(String(e.loginId || '').toLowerCase())
    );

    if (forceOverwrite && isAuthorizedAdmin(req)) {
      finalEmployees = cleanIncomingEmps;
    } else {
      // Smart merge employees by id
      const empMap = new Map<string, any>();
      for (const e of finalEmployees) empMap.set(e.id, e);
      for (const e of cleanIncomingEmps) empMap.set(e.id, { ...(empMap.get(e.id) || {}), ...e });
      finalEmployees = Array.from(empMap.values());
    }
  }

  // Create valid employee ID set for relational integrity
  const validEmpIds = new Set<string>();
  finalEmployees.forEach((e: any) => validEmpIds.add(e.id));
  validEmpIds.add('admin-001');

  let finalRequests = currentDb.requests || [];
  if (Array.isArray(requests)) {
    // SECURITY FILTER: discard any request whose employeeId is not in validEmpIds!
    const cleanIncomingReqs = requests.filter((r: any) => {
      if (!r || !r.id || !r.employeeId) return false;
      if (MOCK_EMP_IDS.has(r.employeeId)) return false;
      if (MOCK_REQ_IDS.has(r.id)) return false;
      return validEmpIds.has(r.employeeId);
    });

    if (forceOverwrite && isAuthorizedAdmin(req)) {
      finalRequests = cleanIncomingReqs;
    } else {
      // Smart merge requests by id
      const reqMap = new Map<string, any>();
      for (const r of finalRequests) reqMap.set(r.id, r);
      for (const r of cleanIncomingReqs) reqMap.set(r.id, { ...(reqMap.get(r.id) || {}), ...r });
      
      // Sort by requestedAt descending
      finalRequests = Array.from(reqMap.values()).sort((a, b) => {
        const timeA = new Date(a.requestedAt || 0).getTime();
        const timeB = new Date(b.requestedAt || 0).getTime();
        return timeB - timeA;
      });
    }
  }

  const updated = {
    ...currentDb,
    employees: finalEmployees,
    requests: finalRequests,
    lastSyncedAt: new Date().toISOString(),
    version: Date.now(),
  };
  writeDb(updated);
  res.json({ 
    success: true, 
    timestamp: updated.lastSyncedAt,
    employees: finalEmployees,
    requests: finalRequests,
    version: updated.version,
  });
});

// Admin Security Audit & Clean endpoint
app.post('/api/admin/clean-audit', (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  const currentDb = readDb();
  writeDb(currentDb);
  res.json({
    success: true,
    message: '미등록 유령 데이터 및 고아 연차 신청이 성공적으로 정화되었습니다.',
    employees: currentDb.employees,
    requests: currentDb.requests,
  });
});

app.post('/api/reset', (req, res) => {
  writeDb(DEFAULT_INITIAL_DATA);
  res.json({ success: true, data: DEFAULT_INITIAL_DATA });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`동작구립 약수데이케어센터 연차관리 시스템 보안 서버 가동 중 (포트: ${PORT})`);
  });
}

startServer();
