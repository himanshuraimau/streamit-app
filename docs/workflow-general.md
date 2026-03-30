# Live Streaming Application Workflow

## User Registration
User open the App  
Selects Create Account  

Enters:
- Name  
- Age  
- Email ID  
- Phone Number  

User have to generate Unique Username and Password (for future logins)  

Clicks Submit  
Receives OTP (Via Phone/Email)  
Verifies with OTP  
Account is created  
Redirected to Profile Setup or Home Page  

---

## Homepage for Users

List/Grid of all Currently Live Streamers  
Tapping a Stream opens the Live Stream Screen  

After Login, User lands on Homepage with 3 Main Sections:

### 1. Watch Global Streamers (Live Now)

---

### 2. See Photos and Shorts from Followed Creators

Dedicated tab/section showing:
- Photos  
- Short Videos (Like reels and shorts)  
- Subscribed Option (If User has paid for any creators subscription the can be seen in this section)

---

### 3. See Photos and Shorts from Trending Creators

Curated feed of:
- Trending photos and shorts (based on likes, views, engagement)  
- From all creators, whether followed or not  

Options:
- Follow new creators  
- Like, comment, and share  

---

### Live Creator Indicator (on top)

At the Top of this section, show a horizontal scroll bar or slider of Profile Pictures of creators who are currently live and user follows them  

If no one is live:
- Show a placeholder message: “No Creators live right now”  

User should be able to see any followed creator if anyone is live  

---

## Trending Creators Section

Display Photos and Shorts ranked by:
- Number of likes  
- Number of comments  
- Number of views  
- Number of shares  
- Recency  

### Interaction Options:
- Like  
- Comment  
- Share  
- Follow Creator  
- View Profile  

---

## Become a Creator

User will have an option to Apply to become Creator in Settings  

### Creator Registration Flow:
1. User Clicks Become a Creator  
2. App prompts for:
   - Government ID (Aadhaar, Passport, DL)  
   - Selfie for verification  
   - Bank Account Details  
   - PAN Card Details  
   - Profile Pictures  
   - Select content category  
3. Submit request  
4. Admin/Automated system reviews  
5. Decision  

### If Approved:
- Creator Badge  
- Access to Go Live  
- Monetization tools enabled  

### If Rejected:
- Notification sent  
- Reason optional  
- Can re-apply after 30 days  

---

## Dual Dashboard Structure

### User Dashboard:
- View live streams  
- Watch photos & shorts  
- Follow creators  
- Like, comment, share  
- Send gifts  
- Manage profile  

### Creator Dashboard:
- Go Live  
- Upload content  
- View earnings  
- Analytics  
- Manage followers  
- Manage KYC  
- Withdraw earnings  

### Switch Option:
Switch between User and Creator dashboard  

---

## Creator Go Live Execution Plan

### Step-by-Step:
1. Open Creator Dashboard  
2. Tap Go Live  
3. Fill:
   - Title  
   - Category  
   - Thumbnail  
   - Tags  
   - Audience (Public / Followers / Invite-only)  
   - Enable monetization (Gifts, Ads, Pay-per-view)  

4. Choose mode:
   - Front/Back camera  
   - Audio only  
   - Filters/music  

5. Tap Start Live  

---

## Creator Live Screen Layout

### Top Bar:
- Live timer  
- Viewer count  
- Likes  
- Earnings counter  

### Main Area:
- Camera feed  
- Overlays:
  - Top gifter  
  - New follower  
  - Chat  

### Bottom Controls:
- End Live  
- Switch camera  
- Mute mic  
- Audio-only  
- Filters  
- Toggle chat  
- Pin message  
- Gift transactions  
- Viewer list  
- Moderation tools  

---

### After Stream Ends:
- Total viewers  
- Total earnings  
- Top gifter  
- Likes & comments  

---

## 10-Second Highlight Feature

Button: [Capture Highlight]

### On tap:
- Capture last 10 seconds  
- Excludes UI overlays  

### Options:
- Save to gallery  
- Share (Instagram, WhatsApp, etc.)  
- Discard  

Max 5 highlights per stream  

Includes:
- Watermark  
- Default caption  

### Note:
- Stored locally  
- Not saved to server unless uploaded  

---

## Viewer Live Stream Screen

### Layout:

#### Top Bar:
- Creator info  
- Viewers count  
- Follow  
- Report  

#### Main:
- Live video  

#### Bottom:
- Chat  
- Message input  
- Like button  
- Gift button  

### Engagement:
- Gift alerts  
- Join notifications  
- Top fan  

---

## Viewer Monetization Options
- Buy coins  
- Send gifts  
- Tip creator  
- Pay-per-view  

---

## Privacy Features
- Hide chat  
- Block/mute users  
- Report  

---

### After Stream Ends:
- Summary  
- Top gifter  
- Follow creator  
- Recommended streams  

---

## Viewer Interaction Workflow

### Default View:
- Video + UI + chat + gifting  

### Gestures:

#### Swipe Left:
- Immersive mode  
- Fullscreen video  
- No UI  

#### Swipe Right:
- Back to normal  

---

## Screen Protection

### Android:
- FLAG_SECURE  

### iOS:
- Screen capture protection  

### Additional:
- Disable screen casting / AirPlay  

---

## Monetization Workflow

### Channels:
- Coins  
- Gifts  
- Premium streams  
- Ads  
- Commission  
- Brand deals  

---

### Coins Purchase:
- Payment gateway  
- Packages (₹299, ₹999)  
- Non-refundable  

---

### Gifts:
- User sends gift  
- Coins deducted  
- Creator earns (minus commission)  

---

### Premium Streams:
- Paid entry  
- Limited seats  
- Commission applied  

---

### Commission:
- Platform takes 20–30%  

---

### Ads:
- CPM / CPC  
- Rewarded ads  

---

## Sponsored Content

Brands can pay for:
- Sponsored streams  
- Featured content  
- Product placement  

Platform takes commission  

---

# THANK YOU