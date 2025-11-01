import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface ChatSettingsCardProps {
  chatSettings: {
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
  onSettingChange: (setting: 'isChatEnabled' | 'isChatDelayed' | 'isChatFollowersOnly') => void;
}

export function ChatSettingsCard({ chatSettings, onSettingChange }: ChatSettingsCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Chat Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Enable Chat</p>
            <p className="text-zinc-400 text-sm">Allow viewers to send messages</p>
          </div>
          <Switch
            checked={chatSettings.isChatEnabled}
            onCheckedChange={() => onSettingChange('isChatEnabled')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Followers-Only Mode</p>
            <p className="text-zinc-400 text-sm">Only followers can chat</p>
          </div>
          <Switch
            checked={chatSettings.isChatFollowersOnly}
            onCheckedChange={() => onSettingChange('isChatFollowersOnly')}
            disabled={!chatSettings.isChatEnabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Slow Mode</p>
            <p className="text-zinc-400 text-sm">3-second delay between messages</p>
          </div>
          <Switch
            checked={chatSettings.isChatDelayed}
            onCheckedChange={() => onSettingChange('isChatDelayed')}
            disabled={!chatSettings.isChatEnabled}
          />
        </div>
      </div>
    </Card>
  );
}
