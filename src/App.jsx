import React, { useState, useEffect } from 'react';
import { 
  Building2, User, Key, Search, ArrowDownCircle, ArrowUpCircle, 
  ArrowRightLeft, History, Headphones, CheckCircle, LogOut, 
  Users, UserPlus, Shield, PlusCircle, Settings, ClipboardList
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Navigation & Session State
  const [user, setUser] = useState(null); // { account_number, name, balance, acc_type, token, role }
  const [page, setPage] = useState('welcome'); // welcome, login-customer, login-employee, register-customer, dashboard-customer, dashboard-employee
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forms
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    account_number: '', name: '', dob: '', age: '', address: '', phone: '', balance: '', acc_type: 'Saving', password: ''
  });
  const [transForm, setTransForm] = useState({ amount: '', recipient: '' });
  const [serviceForm, setServiceForm] = useState({ type: 'Technical Issue', desc: '' });

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [serviceQueuePosition, setServiceQueuePosition] = useState(null);
  const [accountsList, setAccountsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('number');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({ id: '', password: '' });

  // Auto load initial states or fetch periodically
  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchTransactionHistory();
    } else if (user && user.role === 'employee') {
      fetchAccountsList();
      fetchPendingServiceRequests();
    }
  }, [user]);

  // Helper headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token}`
  });

  // Action: Logout
  const handleLogout = () => {
    setUser(null);
    setPage('welcome');
    setLoginForm({ id: '', password: '' });
    setError('');
    setSuccess('');
  };

  // Action: Customer Login
  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_number: loginForm.id, password: loginForm.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      setUser({ ...data.user, token: data.token, role: 'customer' });
      setPage('dashboard-customer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Employee Login
  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login/employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: loginForm.id, password: loginForm.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      setUser({ ...data.employee, token: data.token, role: 'employee' });
      setPage('dashboard-employee');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Customer Signup
  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      setSuccess('Account created successfully! Please login.');
      setSignupForm({
        account_number: '', name: '', dob: '', age: '', address: '', phone: '', balance: '', acc_type: 'Saving', password: ''
      });
      // Redirect to customer login after 2 seconds
      setTimeout(() => {
        setPage('login-customer');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Deposit
  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/transactions/deposit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ account_number: user.account_number, amount: transForm.amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deposit failed');

      setUser(prev => ({ ...prev, balance: data.balance }));
      setSuccess(`Successfully deposited Rs ${transForm.amount}`);
      setTransForm({ amount: '', recipient: '' });
      fetchTransactionHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Withdraw
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/transactions/withdraw`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ account_number: user.account_number, amount: transForm.amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Withdrawal failed');

      setUser(prev => ({ ...prev, balance: data.balance }));
      setSuccess(`Successfully withdrew Rs ${transForm.amount}`);
      setTransForm({ amount: '', recipient: '' });
      fetchTransactionHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/transactions/transfer`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          from_account: user.account_number,
          to_account: transForm.recipient,
          amount: transForm.amount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transfer failed');

      setUser(prev => ({ ...prev, balance: data.balance }));
      setSuccess(`Successfully transferred Rs ${transForm.amount} to account ${transForm.recipient}`);
      setTransForm({ amount: '', recipient: '' });
      fetchTransactionHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Submit Service Request
  const handleServiceRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/service/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          account_number: user.account_number,
          name: user.name,
          service_type: serviceForm.type,
          request_description: serviceForm.desc
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');

      setSuccess(`Service request queued! Current position: ${data.queuePosition}`);
      setServiceQueuePosition(data.queuePosition);
      setServiceForm({ type: 'Technical Issue', desc: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Fetch Transaction History
  const fetchTransactionHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions/history/${user.account_number}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: View All Accounts (Employee)
  const fetchAccountsList = async () => {
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAccountsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Search Account (Employee)
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/accounts/search?q=${searchQuery}&type=${searchType}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Action: Fetch Pending Service Requests (Employee)
  const fetchPendingServiceRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/service/pending`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Process Next Request (Employee)
  const handleProcessNextRequest = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/service/process-next`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to process request');

      setSuccess(`Successfully processed request from ${data.processedRequest.name}`);
      fetchPendingServiceRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  // Action: Add Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/employee`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ employee_id: employeeForm.id, password: employeeForm.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create employee');

      setSuccess('Employee account created successfully!');
      setEmployeeForm({ id: '', password: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Alert Banners */}
      {error && (
        <div className="bg-red-900/60 border border-red-500 text-red-200 px-6 py-4 text-center backdrop-blur-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 px-6 py-4 text-center backdrop-blur-md">
          {success}
        </div>
      )}

      {/* Main router shell */}
      {page === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6">
              <Building2 className="w-16 h-16 text-blue-500" />
            </div>
            <h1 className="brand-title mb-4">STATE BANK OF INDIA</h1>
            <p className="text-xl text-gray-400 font-light">Secure ATM & Portfolio Management Portal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
            <div className="glass-card flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <User className="text-blue-500" /> Customer Access
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Access your portfolio, transfer funds instantly, deposit or withdraw cash, and submit support service queue requests.
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setPage('login-customer')} className="btn btn-primary flex-1">Login</button>
                <button onClick={() => setPage('register-customer')} className="btn btn-secondary flex-1">Register</button>
              </div>
            </div>

            <div className="glass-card flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="text-blue-500" /> Employee Desk
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Manage user bank records, process FIFO customer service requests, search customer databases, and create employee accounts.
                </p>
              </div>
              <button onClick={() => setPage('login-employee')} className="btn btn-secondary w-full">Employee Portal</button>
            </div>
          </div>

          {/* Important Instructions (Replicating C++ behavior) */}
          <div className="glass-card w-full">
            <h3 className="text-lg font-bold mb-4 text-amber-400 flex items-center gap-2">
              <Settings className="w-5 h-5" /> IMPORTANT INSTRUCTIONS
            </h3>
            <div className="text-sm text-gray-400">
              <div className="instruction-item">
                <span className="font-bold text-amber-500">1.</span>
                <p>Keep your account number and password strictly confidential at all times.</p>
              </div>
              <div className="instruction-item">
                <span className="font-bold text-amber-500">2.</span>
                <p>Do not share your OTP or account access credentials with anyone.</p>
              </div>
              <div className="instruction-item">
                <span className="font-bold text-amber-500">3.</span>
                <p>Always click on Logout before closing this web browser tab.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Login Page */}
      {page === 'login-customer' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center">Customer Login</h2>
            <form onSubmit={handleCustomerLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Account Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Account Number" 
                  className="input-field" 
                  value={loginForm.id} 
                  onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter Password" 
                  className="input-field" 
                  value={loginForm.password} 
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
              <button type="button" onClick={() => setPage('welcome')} className="btn btn-secondary w-full">
                Back to Main Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Employee Login Page */}
      {page === 'login-employee' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center">Employee Login</h2>
            <form onSubmit={handleEmployeeLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Employee ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Employee ID" 
                  className="input-field" 
                  value={loginForm.id} 
                  onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter Password" 
                  className="input-field" 
                  value={loginForm.password} 
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Logging in...' : 'Authenticate'}
              </button>
              <button type="button" onClick={() => setPage('welcome')} className="btn btn-secondary w-full">
                Back to Main Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register Customer Page */}
      {page === 'register-customer' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card w-full max-w-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center">New Customer Registration</h2>
            <form onSubmit={handleCustomerSignup} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Account Number</label>
                <input 
                  type="text" required placeholder="Account Number" className="input-field"
                  value={signupForm.account_number}
                  onChange={(e) => setSignupForm({ ...signupForm, account_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <input 
                  type="text" required placeholder="Name" className="input-field"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date of Birth</label>
                <input 
                  type="text" required placeholder="MM/DD/YYYY" className="input-field"
                  value={signupForm.dob}
                  onChange={(e) => setSignupForm({ ...signupForm, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Age</label>
                <input 
                  type="number" required placeholder="Age" className="input-field"
                  value={signupForm.age}
                  onChange={(e) => setSignupForm({ ...signupForm, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Address</label>
                <input 
                  type="text" required placeholder="Address" className="input-field"
                  value={signupForm.address}
                  onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                <input 
                  type="text" required placeholder="Phone Number" className="input-field"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Initial Deposit (Rs)</label>
                <input 
                  type="number" placeholder="Initial Deposit" className="input-field"
                  value={signupForm.balance}
                  onChange={(e) => setSignupForm({ ...signupForm, balance: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Account Type</label>
                <select 
                  className="input-field"
                  value={signupForm.acc_type}
                  onChange={(e) => setSignupForm({ ...signupForm, acc_type: e.target.value })}
                >
                  <option value="Saving">Saving</option>
                  <option value="Current">Current</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <input 
                  type="password" required placeholder="Secure Password" className="input-field"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Register'}
                </button>
                <button type="button" onClick={() => setPage('welcome')} className="btn btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Dashboard */}
      {page === 'dashboard-customer' && user && (
        <div className="dashboard-grid">
          <aside className="sidebar">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="text-blue-500 w-8 h-8" />
                <span className="font-bold text-xl tracking-tight">SBI Portal</span>
              </div>
              <div className="mb-8 p-4 bg-gray-900/60 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500">Welcome,</p>
                <p className="text-lg font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-blue-400">Account: {user.account_number}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
              <div className="text-xs text-gray-600 uppercase px-4 mb-2">Transactions</div>
              <div className="nav-link active cursor-pointer"><Settings className="w-4 h-4" /> Operations</div>
            </nav>
            <button onClick={handleLogout} className="btn btn-danger w-full mt-auto flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </aside>

          <main className="p-8 overflow-y-auto animate-fade-in">
            {/* Balance Widget */}
            <div className="glass-card mb-8 bg-gradient-to-r from-blue-900/40 to-indigo-900/40">
              <p className="text-sm text-blue-300 mb-1">Available Portfolio Balance</p>
              <h2 className="text-5xl font-bold tracking-tight text-white mb-2">
                Rs {parseFloat(user.balance).toLocaleString()}
              </h2>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {user.acc_type} Account
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Cash operations */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <ArrowRightLeft className="text-blue-500" /> Cash Operations
                </h3>
                <div className="flex gap-4 mb-6">
                  <input 
                    type="number" 
                    placeholder="Enter amount (Rs)" 
                    className="input-field" 
                    value={transForm.amount}
                    onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={handleDeposit} className="btn btn-primary flex-1 flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5" /> Deposit
                  </button>
                  <button onClick={handleWithdraw} className="btn btn-secondary flex-1 flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5" /> Withdraw
                  </button>
                </div>
              </div>

              {/* Fund Transfer */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <ArrowRightLeft className="text-blue-500" /> Fund Transfer
                </h3>
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    placeholder="Recipient Account Number" 
                    className="input-field" 
                    value={transForm.recipient}
                    onChange={(e) => setTransForm({ ...transForm, recipient: e.target.value })}
                  />
                  <input 
                    type="number" 
                    placeholder="Transfer Amount (Rs)" 
                    className="input-field" 
                    value={transForm.amount}
                    onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })}
                  />
                  <button onClick={handleTransfer} className="btn btn-primary w-full">
                    Transfer Funds
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Transaction History (Last 10) */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <History className="text-blue-500" /> Recent Transactions
                </h3>
                {transactions.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No transaction history recorded yet.</p>
                ) : (
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {transactions.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                          <p className="font-semibold text-white">{t.type}</p>
                          <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString()}</p>
                        </div>
                        <div className={`font-bold ${t.type.includes('Deposit') || t.type.includes('Transfer In') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.type.includes('Deposit') || t.type.includes('Transfer In') ? '+' : '-'} Rs {t.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Queue Request */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Headphones className="text-blue-500" /> Support Service Queue
                </h3>
                <form onSubmit={handleServiceRequest} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Service Type</label>
                    <select 
                      className="input-field"
                      value={serviceForm.type}
                      onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                    >
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Account Query">Account Query</option>
                      <option value="Loan Information">Loan Information</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Request Details</label>
                    <textarea 
                      rows="3" 
                      required
                      placeholder="Describe your request..." 
                      className="input-field resize-none"
                      value={serviceForm.desc}
                      onChange={(e) => setServiceForm({ ...serviceForm, desc: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full">
                    Submit Queue Request
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Employee Dashboard */}
      {page === 'dashboard-employee' && user && (
        <div className="dashboard-grid">
          <aside className="sidebar">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="text-blue-500 w-8 h-8" />
                <span className="font-bold text-xl tracking-tight text-white">SBI Employee</span>
              </div>
              <div className="mb-8 p-4 bg-gray-900/60 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500">Employee ID:</p>
                <p className="text-lg font-bold text-white">{user.employee_id}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
              <div className="text-xs text-gray-600 uppercase px-4 mb-2">Menu Controls</div>
              <div className="nav-link active cursor-pointer"><ClipboardList className="w-4 h-4" /> Admin Controls</div>
            </nav>
            <button onClick={handleLogout} className="btn btn-danger w-full mt-auto flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </aside>

          <main className="p-8 overflow-y-auto animate-fade-in flex-1">
            <h1 className="text-4xl font-bold mb-8 text-white">Administrative Dashboard</h1>

            {/* Service queue management */}
            <div className="glass-card mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Headphones className="text-amber-500" /> Pending Support Queue ({pendingRequests.length})
                </h2>
                <button onClick={handleProcessNextRequest} className="btn btn-primary" disabled={pendingRequests.length === 0}>
                  Process Next Request (FIFO)
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-gray-400 text-center py-6">All support requests have been processed.</p>
              ) : (
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {pendingRequests.map((req, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-semibold text-white">
                          <span className="text-amber-400">#{idx + 1}</span> {req.service_type}
                        </p>
                        <p className="text-sm text-gray-400">{req.request_description}</p>
                        <p className="text-xs text-gray-500">From: {req.name} ({req.account_number})</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Management & Creation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Account Search */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Search className="text-blue-500" /> Database Account Query
                </h3>
                <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-6">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Search accounts..." 
                      className="input-field flex-1" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select 
                      className="input-field w-[130px]"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <option value="number">By Account#</option>
                      <option value="name">By Name</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-full">Search Records</button>
                </form>

                {searchResults.length > 0 && (
                  <div className="flex flex-col gap-4 max-h-[250px] overflow-y-auto">
                    {searchResults.map((acc, idx) => (
                      <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold text-white">{acc.name}</p>
                          <span className="text-xs text-blue-400 font-mono">Acc: {acc.account_number}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                          <div>Age: {acc.age}</div>
                          <div>Phone: {acc.phone}</div>
                          <div>Address: {acc.address}</div>
                          <div className="font-bold text-amber-400">Bal: Rs {acc.balance}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Employee */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <UserPlus className="text-blue-500" /> Create Employee Account
                </h3>
                <form onSubmit={handleAddEmployee} className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    required
                    placeholder="New Employee ID" 
                    className="input-field" 
                    value={employeeForm.id}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, id: e.target.value })}
                  />
                  <input 
                    type="password" 
                    required
                    placeholder="New Password" 
                    className="input-field" 
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  />
                  <button type="submit" className="btn btn-secondary w-full">Create Account</button>
                </form>
              </div>
            </div>

            {/* View all customer records */}
            <div className="glass-card">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Users className="text-blue-500" /> Database Accounts List ({accountsList.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Account#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Phone</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountsList.map((acc, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-sm text-blue-400">{acc.account_number}</td>
                        <td className="font-semibold text-white">{acc.name}</td>
                        <td>{acc.acc_type}</td>
                        <td>{acc.phone}</td>
                        <td className="font-bold text-emerald-400">Rs {acc.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
