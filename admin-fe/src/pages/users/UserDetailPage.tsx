import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usersApi } from '@/lib/api/users.api';
import { queryKeys } from '@/lib/queryKeys';
import { format } from 'date-fns';
import { RiLockLine, RiBankLine, RiChatOffLine, RiKeyLine } from '@remixicon/react';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.users.detail(id!),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RiLockLine className="mr-2 h-4 w-4" />
            Freeze
          </Button>
          <Button variant="outline" size="sm">
            <RiChatOffLine className="mr-2 h-4 w-4" />
            Disable Chat
          </Button>
          <Button variant="outline" size="sm">
            <RiKeyLine className="mr-2 h-4 w-4" />
            Reset Password
          </Button>
          <Button variant="destructive" size="sm">
            <RiBankLine className="mr-2 h-4 w-4" />
            Ban User
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
          <TabsTrigger value="notes">Admin Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-sm">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={user.isSuspended ? 'destructive' : 'default'}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Joined</p>
                  <p className="text-sm">{format(new Date(user.createdAt), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                  <p className="text-sm">
                    {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'PPP') : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Login IP</p>
                  <p className="text-sm">{user.lastLoginIp || 'N/A'}</p>
                </div>
              </div>

              {user.bio && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bio</p>
                  <p className="text-sm">{user.bio}</p>
                </div>
              )}

              {user.isSuspended && user.suspendedReason && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm font-medium text-destructive">Suspension Reason</p>
                  <p className="text-sm text-muted-foreground">{user.suspendedReason}</p>
                  {user.suspensionExpiresAt && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Expires: {format(new Date(user.suspensionExpiresAt), 'PPP')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>User's coin balance and transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {user.wallet ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">{user.wallet.balance} coins</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold">{user.wallet.totalEarned} coins</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">{user.wallet.totalSpent} coins</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No wallet information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent user activity and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity history coming soon...</p>
            </CardContent>
          </Card>

          {user.banHistory && user.banHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ban History</CardTitle>
                <CardDescription>Previous bans and suspensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.banHistory.map((ban, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <p className="text-sm font-medium">{ban.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        Banned on {format(new Date(ban.bannedAt), 'PPP')} by {ban.bannedBy}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>Internal notes about this user</CardDescription>
            </CardHeader>
            <CardContent>
              {user.adminNotes ? (
                <p className="text-sm">{user.adminNotes}</p>
              ) : (
                <p className="text-muted-foreground">No admin notes available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserDetailPage;
