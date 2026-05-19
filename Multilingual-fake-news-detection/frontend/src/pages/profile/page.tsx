import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FakeNewsAPI from '../../services/api';
import { checkLocalCurrentPassword, deleteLocalAccount, getAuthenticatedUser, updateAuthenticatedUser, updateLocalPassword } from '../../services/auth';

type Tab = 'profile' | 'security';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    bio: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const authUser = getAuthenticatedUser();
        const userEmail = (authUser?.email || '').trim().toLowerCase();
        const response = await FakeNewsAPI.getProfile(userEmail);

        if (response?.success && response.profile) {
          const mergedProfile = {
            name: response.profile.name || authUser?.name || '',
            email: response.profile.email || authUser?.email || '',
            phone: response.profile.phone || '',
            organization: response.profile.organization || '',
            role: response.profile.role || '',
            bio: response.profile.bio || '',
          };

          setProfileData((prev) => ({
            ...prev,
            ...mergedProfile,
          }));

          updateAuthenticatedUser({
            name: mergedProfile.name,
            email: mergedProfile.email,
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const authUser = getAuthenticatedUser();
      const userEmail = (authUser?.email || profileData.email || '').trim().toLowerCase();

      const response = await FakeNewsAPI.saveProfile(profileData, userEmail);
      if (response?.success && response.profile) {
        const savedProfile = {
          name: response.profile.name || '',
          email: response.profile.email || '',
          phone: response.profile.phone || '',
          organization: response.profile.organization || '',
          role: response.profile.role || '',
          bio: response.profile.bio || '',
        };

        setProfileData((prev) => ({
          ...prev,
          ...savedProfile,
        }));

        updateAuthenticatedUser({
          name: savedProfile.name,
          email: savedProfile.email,
        });
        showToast('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const authUser = getAuthenticatedUser();
    const userEmail = (authUser?.email || profileData.email || '').trim().toLowerCase();

    if (!userEmail) {
      showToast('Unable to identify current user');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showToast('Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showToast('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast('New password and confirmation do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showToast('New password must be different from current password');
      return;
    }

    const localPasswordCheck = checkLocalCurrentPassword(userEmail, passwordForm.currentPassword);
    if (localPasswordCheck.knownUser && !localPasswordCheck.valid) {
      showToast('Current password is incorrect');
      return;
    }

    try {
      setChangingPassword(true);
      await FakeNewsAPI.changePassword({
        userEmail,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      updateLocalPassword(userEmail, passwordForm.newPassword);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      showToast('Password changed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      showToast(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const authUser = getAuthenticatedUser();
    const userEmail = (authUser?.email || profileData.email || '').trim().toLowerCase();

    if (!userEmail) {
      showToast('Unable to identify account for deletion');
      return;
    }

    const confirmed = window.confirm('This will permanently delete your account and prediction history. Continue?');
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      await FakeNewsAPI.deleteAccount(userEmail);
      deleteLocalAccount(userEmail);
      showToast('Account deleted successfully');
      setTimeout(() => {
        navigate('/signup', { replace: true });
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      showToast(message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profile Info', icon: 'ri-user-line' },
    { key: 'security', label: 'Security', icon: 'ri-lock-line' },
  ];

  const initials = profileData.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium animate-pulse">
          <i className="ri-check-line text-lg"></i>{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 rounded-lg">
          <i className="ri-user-settings-line text-teal-600 text-lg"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Account Settings</h1>
          <p className="text-xs text-slate-500">Manage your profile, security, and preferences</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Avatar Card */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 mb-3 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
              {initials}
            </div>
            <p className="text-sm font-semibold text-slate-900">{profileData.name || 'User'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{profileData.role || 'No role selected'}</p>
          </div>

          {/* Nav */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-teal-500/10 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <i className={`${tab.icon} text-base`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div>
                <div className="px-6 py-4 border-b border-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900">Profile Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Update your personal details</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Avatar Row */}
                  <div className="flex items-center gap-5 pb-5 border-b border-slate-50">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <button className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-all mr-2 whitespace-nowrap cursor-pointer">
                        <i className="ri-upload-line mr-1.5"></i>Upload Photo
                      </button>
                      <button className="text-xs text-slate-500 hover:text-slate-700 whitespace-nowrap cursor-pointer">Remove</button>
                      <p className="text-xs text-slate-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', key: 'name', type: 'text' },
                      { label: 'Email Address', key: 'email', type: 'email' },
                      { label: 'Phone Number', key: 'phone', type: 'tel' },
                      { label: 'Organization', key: 'organization', type: 'text' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">{f.label}</label>
                        <input
                          type={f.type}
                          value={profileData[f.key as keyof typeof profileData]}
                          onChange={(e) => setProfileData({ ...profileData, [f.key]: e.target.value })}
                          placeholder={`Enter ${f.label.toLowerCase()}`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
                      <select
                        value={profileData.role}
                        onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer bg-white"
                      >
                        <option value="">Select role</option>
                        {['Journalist', 'Researcher', 'Fact Checker', 'Student', 'Other'].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us a little about yourself"
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap cursor-pointer">Cancel</button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${saving ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div>
                <div className="px-6 py-4 border-b border-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900">Security Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your password and account security</p>
                </div>
                <div className="p-6 space-y-4">
                  {/* Change Password */}
                  <div className="border border-slate-100 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Change Password</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmNewPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                          placeholder="Enter confirm new password"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${changingPassword ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                      >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border border-rose-200 rounded-xl p-5 bg-rose-50/50">
                    <h3 className="text-sm font-semibold text-rose-800 mb-1 flex items-center gap-2">
                      <i className="ri-error-warning-line"></i>Danger Zone
                    </h3>
                    <p className="text-xs text-rose-700 mb-3">Once you delete your account, all data will be permanently removed.</p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${deletingAccount ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
                    >
                      {deletingAccount ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
