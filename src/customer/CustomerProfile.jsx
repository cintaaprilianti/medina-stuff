import { useState, useEffect } from 'react';
import { Edit2, Save } from 'lucide-react';

function CustomerProfile() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userData, setUserData] = useState({
    id: '',
    nama: 'User',
    email: 'user@example.com',
    nomorTelepon: '08123456789',
    alamat: 'Belum diatur'
  });
  const [profileForm, setProfileForm] = useState(userData);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const updatedUser = {
        id: user.id || '',
        nama: user.nama || 'User',
        email: user.email || 'user@example.com',
        nomorTelepon: user.nomorTelepon || user.phone || '08123456789',
        alamat: user.alamat || 'Belum diatur'
      };
      setUserData(updatedUser);
      setProfileForm(updatedUser);
    }
  }, []);

  const handleSaveProfile = () => {
    setUserData(profileForm);
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, ...profileForm };
    localStorage.setItem('user', JSON.stringify(updated));
    setIsEditingProfile(false);
    alert('Profil berhasil diperbarui!');
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola informasi akun kamu</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b">
          <div className="w-20 h-20 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            {getInitials(userData.nama)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-800">{userData.nama}</h2>
            <p className="text-sm text-gray-600">{userData.email}</p>
          </div>
          <button
            onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
            className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-xl transition"
          >
            {isEditingProfile ? <><Save className="w-4 h-4" /> Simpan</> : <><Edit2 className="w-4 h-4" /> Edit</>}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Nama Lengkap', field: 'nama' },
            { label: 'Email', field: 'email', type: 'email' },
            { label: 'No. Telepon', field: 'nomorTelepon' },
            { label: 'Alamat Lengkap', field: 'alamat', textarea: true }
          ].map(({ label, field, type, textarea }) => (
            <div key={field} className={textarea ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
              {isEditingProfile ? (
                textarea ? (
                  <textarea
                    value={profileForm[field]}
                    onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:outline-none text-sm"
                  />
                ) : (
                  <input
                    type={type || 'text'}
                    value={profileForm[field]}
                    onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:outline-none text-sm"
                  />
                )
              ) : (
                <p className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700">{userData[field]}</p>
              )}
            </div>
          ))}
        </div>

        {isEditingProfile && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSaveProfile}
              className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold hover:shadow-xl transition"
            >
              Simpan Perubahan
            </button>
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setProfileForm(userData);
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerProfile;