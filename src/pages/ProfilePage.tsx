import { useState } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Settings, Mail, Calendar, Save } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

export const ProfilePage = () => {
  const { currentUser } = useAuth();
  
  // Manual user data - can be edited
  const [userData, setUserData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    bio: '',
    location: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - in a real app, this would update the user profile
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setUserData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: '',
      bio: '',
      location: '',
    });
    setIsEditing(false);
  };


  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {userData.displayName
                      ? userData.displayName.charAt(0).toUpperCase()
                      : userData.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      {userData.displayName || 'User Profile'}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {userData.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        isLoading={isSaving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <Input
                    value={userData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Enter your display name"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-50">
                    {userData.displayName || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-50">
                    {userData.email || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-50">
                    {userData.phone || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                {isEditing ? (
                  <Input
                    value={userData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter your location"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-50">
                    {userData.location || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={userData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:ring-offset-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-50 whitespace-pre-wrap">
                    {userData.bio || 'No bio provided'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User ID
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {currentUser?.uid || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Verified
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentUser?.emailVerified ? (
                      <span className="text-green-600 dark:text-green-400">Verified</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">Not Verified</span>
                    )}
                  </p>
                </div>
              </div>
              {currentUser?.metadata?.creationTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Created
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(currentUser.metadata.creationTime)}
                  </p>
                </div>
              )}
              {currentUser?.metadata?.lastSignInTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Sign In
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(currentUser.metadata.lastSignInTime)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dark Mode
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Toggle dark mode (handled by system)
                  </p>
                </div>
                <Button variant="outline" disabled>
                  System Default
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive email updates
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

