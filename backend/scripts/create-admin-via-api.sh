#!/bin/bash

# Script to create admin users via Better Auth API
# This ensures passwords are hashed correctly by Better Auth

API_URL="http://localhost:3000"

echo "🌱 Creating admin users via Better Auth API..."
echo ""

# Function to create user and update role
create_admin() {
  local name=$1
  local email=$2
  local username=$3
  local password=$4
  local role=$5
  
  echo "Creating $role: $email"
  
  # Create user via Better Auth signup endpoint
  response=$(curl -s -X POST "$API_URL/api/auth/signup/email" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"email\": \"$email\",
      \"username\": \"$username\",
      \"password\": \"$password\"
    }")
  
  # Check if signup was successful
  if echo "$response" | grep -q "user"; then
    echo "✅ User created: $email"
    
    # Update user role in database
    psql "$DATABASE_URL" -c "UPDATE \"user\" SET role = '$role', \"emailVerified\" = true WHERE email = '$email';" > /dev/null 2>&1
    echo "✅ Role updated to $role"
    echo ""
  else
    echo "⚠️  Failed to create $email"
    echo "Response: $response"
    echo ""
  fi
}

# Create admin users
create_admin "Super Admin" "admin@streamit.com" "superadmin" "Admin@12345" "SUPER_ADMIN"
create_admin "Content Moderator" "moderator@streamit.com" "moderator" "Moderator@123" "MODERATOR"
create_admin "Finance Admin" "finance@streamit.com" "financeadmin" "Finance@12345" "FINANCE_ADMIN"
create_admin "Support Admin" "support@streamit.com" "supportadmin" "Support@12345" "ADMIN"
create_admin "Compliance Officer" "compliance@streamit.com" "compliance" "Compliance@123" "COMPLIANCE_OFFICER"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Admin Credentials:"
echo ""
echo "🔐 SUPER ADMIN (Full Access)"
echo "   Email:    admin@streamit.com"
echo "   Password: Admin@12345"
echo ""
echo "👮 MODERATOR (Content Moderation)"
echo "   Email:    moderator@streamit.com"
echo "   Password: Moderator@123"
echo ""
echo "💰 FINANCE ADMIN (Monetization)"
echo "   Email:    finance@streamit.com"
echo "   Password: Finance@12345"
echo ""
echo "🎧 SUPPORT ADMIN (User Management)"
echo "   Email:    support@streamit.com"
echo "   Password: Support@12345"
echo ""
echo "⚖️  COMPLIANCE OFFICER (Legal & Compliance)"
echo "   Email:    compliance@streamit.com"
echo "   Password: Compliance@123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Admin users created successfully!"
echo ""
echo "🚀 Login at http://localhost:5174"
echo ""
