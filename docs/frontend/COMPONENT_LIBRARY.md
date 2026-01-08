# Component Library

Complete reference for all React components in StreamIt frontend.

## Component Categories

1. [UI Primitives](#ui-primitives) - Radix UI based components
2. [Auth Components](#auth-components) - Authentication
3. [Stream Components](#stream-components) - Live streaming
4. [Payment Components](#payment-components) - Monetization
5. [Common Components](#common-components) - Shared utilities

---

## UI Primitives

Located in `src/components/ui/`. Built on Radix UI with TailwindCSS styling.

### Button

**File**: `src/components/ui/button.tsx`

Flexible button component with multiple variants.

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// States
<Button disabled>Disabled</Button>
<Button asChild>
  <Link to="/somewhere">As Link</Link>
</Button>
```

**Props**:
- `variant`: `default` | `destructive` | `outline` | `secondary` | `ghost` | `link`
- `size`: `default` | `sm` | `lg` | `icon`
- `asChild`: Render as child component

---

### Input

**File**: `src/components/ui/input.tsx`

Text input with consistent styling.

```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// With icon
<div className="relative">
  <SearchIcon className="absolute left-3 top-3" />
  <Input className="pl-10" placeholder="Search..." />
</div>

// Disabled
<Input disabled value="Cannot edit" />

// Error state
<Input className="border-red-500" />
```

**Props**: Standard HTML input props

---

### Dialog

**File**: `src/components/ui/dialog.tsx`

Modal dialog component.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Components**:
- `Dialog`: Wrapper
- `DialogTrigger`: Opens dialog
- `DialogContent`: Main content
- `DialogHeader`: Header section
- `DialogTitle`: Title text
- `DialogDescription`: Description text
- `DialogFooter`: Footer actions

---

### Card

**File**: `src/components/ui/card.tsx`

Content container with consistent styling.

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Stream Title</CardTitle>
    <CardDescription>Live now with 1.2K viewers</CardDescription>
  </CardHeader>
  <CardContent>
    <img src={thumbnail} alt="Stream" />
  </CardContent>
  <CardFooter>
    <Button>Watch Now</Button>
  </CardFooter>
</Card>
```

---

### Form

**File**: `src/components/ui/form.tsx`

Form components integrated with React Hook Form.

```tsx
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const form = useForm();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="email@example.com" {...field} />
          </FormControl>
          <FormDescription>
            Your email address
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

---

### Dropdown Menu

**File**: `src/components/ui/dropdown-menu.tsx`

Accessible dropdown menu.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleProfile}>
      Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleSettings}>
      Settings
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout}>
      Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Tabs

**File**: `src/components/ui/tabs.tsx`

Tabbed interface.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="streams">
  <TabsList>
    <TabsTrigger value="streams">Streams</TabsTrigger>
    <TabsTrigger value="videos">Videos</TabsTrigger>
    <TabsTrigger value="about">About</TabsTrigger>
  </TabsList>
  <TabsContent value="streams">
    <StreamsList />
  </TabsContent>
  <TabsContent value="videos">
    <VideosList />
  </TabsContent>
  <TabsContent value="about">
    <AboutSection />
  </TabsContent>
</Tabs>
```

---

### Sheet

**File**: `src/components/ui/sheet.tsx`

Slide-out panel (drawer).

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Settings</SheetTitle>
      <SheetDescription>
        Adjust your preferences
      </SheetDescription>
    </SheetHeader>
    <div className="mt-6">
      {/* Settings content */}
    </div>
  </SheetContent>
</Sheet>
```

**Props**:
- `side`: `top` | `right` | `bottom` | `left`

---

### Alert

**File**: `src/components/ui/alert.tsx`

Alert/notification component.

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

<Alert>
  <InfoIcon className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    Your stream is starting soon.
  </AlertDescription>
</Alert>

// Variants
<Alert variant="default">Default</Alert>
<Alert variant="destructive">Error!</Alert>
```

---

### Badge

**File**: `src/components/ui/badge.tsx`

Small badge/chip component.

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Live</Badge>
<Badge variant="secondary">Offline</Badge>
<Badge variant="destructive">Banned</Badge>
<Badge variant="outline">Pending</Badge>
```

---

### Tooltip

**File**: `src/components/ui/tooltip.tsx`

Hover tooltip.

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### Textarea

**File**: `src/components/ui/textarea.tsx`

Multi-line text input.

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea 
  placeholder="Enter description..."
  rows={4}
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### Switch

**File**: `src/components/ui/switch.tsx`

Toggle switch.

```tsx
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

<div className="flex items-center space-x-2">
  <Switch 
    id="airplane-mode"
    checked={enabled}
    onCheckedChange={setEnabled}
  />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

---

### Skeleton

**File**: `src/components/ui/skeleton.tsx`

Loading placeholder.

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Single skeleton
<Skeleton className="h-4 w-[250px]" />

// Card skeleton
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-32 w-full" />
</div>
```

---

### Sidebar

**File**: `src/components/ui/sidebar.tsx`

Navigation sidebar (custom implementation).

```tsx
import { Sidebar } from '@/components/ui/sidebar';

<Sidebar>
  {/* Navigation items */}
</Sidebar>
```

---

### File Upload

**File**: `src/components/ui/file-upload.tsx`

File upload component.

```tsx
import { FileUpload } from '@/components/ui/file-upload';

<FileUpload
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  onUpload={(file) => handleUpload(file)}
/>
```

---

### Toast (Sonner)

**File**: `src/components/ui/sonner.tsx`

Toast notifications using Sonner.

```tsx
import { toast } from 'sonner';

// Success
toast.success('Stream started!');

// Error
toast.error('Failed to upload');

// Info
toast.info('New follower');

// Promise
toast.promise(
  uploadFile(),
  {
    loading: 'Uploading...',
    success: 'Uploaded!',
    error: 'Failed',
  }
);
```

---

## Auth Components

Located in `src/components/auth/`.

### Auth Navbar

**File**: `src/components/auth/auth-navbar.tsx`

Navigation bar for authentication pages.

```tsx
import { AuthNavbar } from '@/components/auth/auth-navbar';

<AuthNavbar />
```

**Features**:
- StreamIt logo
- Links to Sign In / Sign Up
- Responsive design

---

## Stream Components

Located in `src/components/stream/`.

### Stream Player

**File**: `src/components/stream/stream-player.tsx`

Main live stream player component.

```tsx
import { StreamPlayer } from '@/components/stream';

<StreamPlayer
  streamId={streamId}
  token={liveKitToken}
  onEnd={() => console.log('Stream ended')}
/>
```

**Features**:
- LiveKit integration
- Video player
- Audio controls
- Quality selection
- Fullscreen mode
- Viewer count
- Stream status

**Props**:
- `streamId`: Stream ID
- `token`: LiveKit token
- `onEnd`: Callback when stream ends

---

### Video Player

**File**: `src/components/stream/video-player.tsx`

Video player for VOD content.

```tsx
import { VideoPlayer } from '@/components/stream/video-player';

<VideoPlayer
  videoUrl={s3Url}
  thumbnailUrl={thumbnailUrl}
  autoplay={false}
/>
```

**Props**:
- `videoUrl`: Video file URL
- `thumbnailUrl`: Preview thumbnail
- `autoplay`: Auto-play on load

---

### Chat

**File**: `src/components/stream/chat.tsx`

Live chat component for streams.

```tsx
import { Chat } from '@/components/stream';

<Chat
  streamId={streamId}
  userId={currentUser.id}
  username={currentUser.username}
/>
```

**Features**:
- Real-time messages
- User mentions
- Emojis
- Moderation
- Message history

**Props**:
- `streamId`: Stream ID
- `userId`: Current user ID
- `username`: Current username

---

### Streamer Info Card

**File**: `src/components/stream/streamer-info-card.tsx`

Creator information display.

```tsx
import { StreamerInfoCard } from '@/components/stream/streamer-info-card';

<StreamerInfoCard
  creator={creator}
  isFollowing={isFollowing}
  onFollow={handleFollow}
  onSubscribe={handleSubscribe}
/>
```

**Features**:
- Avatar and name
- Bio
- Follower count
- Follow/unfollow button
- Subscribe button
- Social links

---

## Payment Components

Located in `src/components/payment/`.

### Coin Package Card

**File**: `src/components/payment/CoinPackageCard.tsx`

Displays coin package for purchase.

```tsx
import { CoinPackageCard } from '@/components/payment/CoinPackageCard';

<CoinPackageCard
  package={{
    id: '1',
    amount: 100,
    price: 9.99,
    bonus: 10,
  }}
  onSelect={handleSelect}
  selected={selected}
/>
```

**Props**:
- `package`: Package details
- `onSelect`: Selection callback
- `selected`: Is selected

---

### Coin Balance

**File**: `src/components/payment/CoinBalance.tsx`

Displays user's coin balance.

```tsx
import { CoinBalance } from '@/components/payment/CoinBalance';

<CoinBalance balance={user.coins} />
```

Shows:
- Current balance
- Coin icon
- Link to purchase

---

### Discount Code Input

**File**: `src/components/payment/DiscountCodeInput.tsx`

Discount code application.

```tsx
import { DiscountCodeInput } from '@/components/payment/DiscountCodeInput';

<DiscountCodeInput
  onApply={(code) => handleApplyDiscount(code)}
  loading={isApplying}
/>
```

**Features**:
- Code input
- Apply button
- Loading state
- Success/error messages

---

### Applied Discount

**File**: `src/components/payment/AppliedDiscount.tsx`

Shows applied discount.

```tsx
import { AppliedDiscount } from '@/components/payment/AppliedDiscount';

<AppliedDiscount
  code={discount.code}
  discountPercent={discount.percent}
  onRemove={handleRemove}
/>
```

**Shows**:
- Discount code
- Discount percentage
- Original price
- Discounted price
- Remove button

---

### Gift Picker

**File**: `src/components/payment/GiftPicker.tsx`

Gift selection modal.

```tsx
import { GiftPicker } from '@/components/payment/GiftPicker';

<GiftPicker
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSend={(giftId) => handleSendGift(giftId)}
  creatorId={creatorId}
/>
```

**Features**:
- Gift categories
- Gift preview
- Coin cost
- Send button
- Balance check

---

### Gift Button

**File**: `src/components/payment/GiftButton.tsx`

Button to open gift picker.

```tsx
import { GiftButton } from '@/components/payment/GiftButton';

<GiftButton
  onClick={() => setShowGiftPicker(true)}
  disabled={!isAuthenticated}
/>
```

---

### Gift Animation

**File**: `src/components/payment/GiftAnimation.tsx`

Animated gift display.

```tsx
import { GiftAnimation } from '@/components/payment/GiftAnimation';

<GiftAnimation
  gift={gift}
  sender={sender}
  onComplete={() => console.log('Animation done')}
/>
```

Shows animated gift when sent during stream.

---

### Purchase History Item

**File**: `src/components/payment/PurchaseHistoryItem.tsx`

Single purchase history entry.

```tsx
import { PurchaseHistoryItem } from '@/components/payment/PurchaseHistoryItem';

<PurchaseHistoryItem
  purchase={{
    id: '1',
    type: 'COINS',
    amount: 100,
    price: 9.99,
    date: new Date(),
    status: 'COMPLETED',
  }}
/>
```

**Displays**:
- Purchase type
- Amount/quantity
- Price paid
- Date
- Status

---

## Common Components

Located in `src/components/common/`.

### Truncated Text

**File**: `src/components/common/TruncatedText.tsx`

Text with overflow truncation.

```tsx
import { TruncatedText } from '@/components/common/TruncatedText';

<TruncatedText
  text={longText}
  maxLength={100}
  showMore={true}
/>
```

**Props**:
- `text`: Full text
- `maxLength`: Character limit
- `showMore`: Show "Show more" button

---

## Component Usage Patterns

### 1. Form with Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### 2. Modal Dialog

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function DeleteConfirmation({ onConfirm }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Loading States

```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

// Usage with data
function StreamCard({ stream, isLoading }) {
  if (isLoading) return <LoadingCard />;
  
  return (
    <Card>
      {/* Actual content */}
    </Card>
  );
}
```

### 4. Responsive Layout

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';

function ResponsiveNav() {
  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex gap-4">
        <Button variant="ghost">Home</Button>
        <Button variant="ghost">Browse</Button>
        <Button variant="ghost">Following</Button>
      </nav>

      {/* Mobile */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="flex flex-col gap-4">
            <Button variant="ghost">Home</Button>
            <Button variant="ghost">Browse</Button>
            <Button variant="ghost">Following</Button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

---

## Styling Guidelines

### 1. Use Tailwind Utilities

```tsx
<div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
  <h2 className="text-xl font-bold">Title</h2>
  <Button size="sm">Action</Button>
</div>
```

### 2. Responsive Classes

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

### 3. Dark Theme (default)

```tsx
<div className="bg-gray-900 text-white border-gray-800">
  {/* Content */}
</div>
```

### 4. Conditional Classes

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>
```

---

## Accessibility

All UI components follow accessibility best practices:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast

---

## Performance Tips

1. **Lazy Load**: Use `React.lazy()` for heavy components
2. **Memoization**: Use `React.memo()` for expensive renders
3. **Virtual Lists**: Use for long lists
4. **Debounce**: Use for search inputs
5. **Optimize Images**: Use lazy loading and proper sizing

---

## Next Steps

- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - Learn state patterns
- [ROUTING_PAGES.md](./ROUTING_PAGES.md) - Explore all pages
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand patterns

---

**Component library complete!** All components documented with examples. 🎨
