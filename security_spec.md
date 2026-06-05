# Security Specification & Threat Model
## Hamro Tournament Database Engine

This document defines the zero-trust data validation invariants, the "Dirty Dozen" threat payloads designed to break our data models, and the security assertions for the Firestore DB engine.

---

## 1. Data Invariants (The Infrangible Laws)

1. **User Balance Integrity (No Free Points)**: A user can NEVER increase their own wallet balance via client-side updates. They may only decrease their wallet balance in verified increments (e.g., paying tournament entry fees, or locking funds during a pending withdrawal). Balance increases can only be executed by verified admins.
2. **Double-Spend Prevention (No Multiple Signups for Single Cost)**: Users must register with true matching IDs, pay the fee per entry, and entry states cannot be mutated once submitted.
3. **Immutability of Locked Identifiers**: Free Fire Player ID (`ffUid`) and In-game Name (`ffIgn`) can be set once. After marking them as locked (`ffUidLocked == true` or `ffIgnLocked == true`), any subsequent edits by the user are strictly denied to preserve competitive fairplay.
4. **Relational Sync Integrity**: Users can only register themselves for a tournament (`request.auth.uid == data.userId`). They cannot register other users.
5. **No Spoofed Transactions**: Users cannot create manually approved deposits or custom transactions. They can only create pending deposit slips or request a withdrawal with a 10-digit mobile number.
6. **Isolation of Administrative Roles**: Users cannot designate themselves as admins. The `role` field on user profiles is completely immutable by the user.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following specific JSON payloads are designed to attack the database's Identity, Integrity, and State machines. Our ruleset guarantees that ALL of these payloads return `PERMISSION_DENIED` on evaluation.

### [Attack 1] Self-Privilege Escalation (Administrative Spoofing)
* **Goal**: Non-admin user attempts to upgrade themselves to an administrator role.
* **Target Document**: `users/malicious_user_uid`
* **Payload**:
```json
{
  "uid": "malicious_user_uid",
  "email": "user@gmail.com",
  "username": "GamerX",
  "wallet": 100,
  "role": "admin"
}
```
* **Defense**: User rule blocks any modifications of `role` by non-admins, enforcing strict `affectedKeys` schema matches during updates.

### [Attack 2] Self-Minting / Wallet Inflation Request
* **Goal**: User attempts to update their user document to arbitrarily credit themselves with free funds.
* **Target Document**: `users/malicious_user_uid`
* **Payload**:
```json
{
  "wallet": 999999
}
```
* **Defense**: User rule allows wallet modification only if it is decreased (e.g., registration fee debit or withdrawal) and paired with matching state transitions. Arbitrary increases are flatly denied.

### [Attack 3] Free Fire Identity Hijacking / Spoofing after Lock
* **Goal**: A banned player attempts to change their locked tournament e-sports Free Fire UID.
* **Target Document**: `users/malicious_user_uid`
* **Payload**:
```json
{
  "ffUid": "9876543210",
  "ffUidLocked": true
}
```
* **Constraint**: In the existing database, `"ffUidLocked": true` already exists.
* **Defense**: The rule checks `(!resource.data.keys().hasAll(['ffUidLocked']) || !resource.data.ffUidLocked)`. Since active lock is true, the write is denied.

### [Attack 4] Orphaned Tournament Creation (Malicious Listing)
* **Goal**: Normal gamer bypasses admin gates and schedules a custom fake tournament with real entry fees.
* **Target Document**: `tournaments/fake_tournament_id`
* **Payload**:
```json
{
  "tournamentId": "HT-FAKE",
  "title": "Fake Cash Cup",
  "entryFee": 500,
  "prizePool": 25000,
  "maxPlayers": 100,
  "status": "upcoming"
}
```
* **Defense**: Create/update rules for the `tournaments` collection mandate verified administrative roles.

### [Attack 5] Direct Peer-to-Peer Wallet Depletion (ID Spoofing)
* **Goal**: Bypassing client UI to register another victim into a tournament using the victim's wallet funds.
* **Target Document**: `tournamentRegistrations/stolen_registration_id`
* **Payload**:
```json
{
  "userId": "innocent_victim_uid",
  "userName": "VictimGamer",
  "tournamentId": "HT-LEGIT",
  "entryFee": 100,
  "status": "registered"
}
```
* **Defense**: The registration rule strictly mandates `request.resource.data.userId == request.auth.uid`.

### [Attack 6] Free Play Attack / Registration Bypass
* **Goal**: Registering for the tournament while setting `entryFee` in the registration record to `0` instead of the official `100`.
* **Target Document**: `tournamentRegistrations/bypass_reg_id`
* **Payload**:
```json
{
  "userId": "malicious_user_uid",
  "userName": "MaliciousGamer",
  "tournamentId": "HT-PREMIUM",
  "entryFee": 0,
  "status": "registered"
}
```
* **Defense**: The client can create but standard state validation enforces strict fee-matching. Furthermore, the user balance is atomically decremented by the true cost before registration completes (Relational Sync validation).

### [Attack 7] Auto-Approval of Deposit Slips
* **Goal**: Triggering a fake cash-in of ₹10,000 by setting status to approved.
* **Target Document**: `deposits/slip_xyz`
* **Payload**:
```json
{
  "userId": "malicious_user_uid",
  "amount": 10000,
  "transactionId": "MOCKTXN9999",
  "status": "approved",
  "createdAt": "2026-06-04T12:00:00Z"
}
```
* **Defense**: Non-admins can only create "pending" deposits. Attempts to create/update as "approved" are denied via checking the status field of the incoming resource payload.

### [Attack 8] Admin-Notification Forge
* **Goal**: Injecting a spoofed server notification to trick users into visiting external links.
* **Target Document**: `notifications/spoof_notif`
* **Payload**:
```json
{
  "userId": "all",
  "title": "🎁 FREE DIAMONDS!",
  "body": "Click here: HTTP://FAKE-STEAL.COM",
  "type": "announcement",
  "isRead": false
}
```
* **Defense**: Non-admin write operations for public/role targets are blocked. Normal users can only write specific notification formats representing their own local status.

### [Attack 9] Denial-of-Wallet Resource Poisoning (Blanket PII Scraping)
* **Goal**: Maliciously scraping all user profiles (including emails, eSewa IDs, and balances) using a blanket lookup.
* **Query Pattern**: Fetching all documents in `users/` without specifying criteria or ownership.
* **Defense**: The query validator restricts raw blanket reads of PII properties or enforces strict rule structures for database list operations.

### [Attack 10] Bypass Pending Flag in Withdrawal Payout
* **Goal**: Submitting a payout request with status "approved" or "completed" to force immediate cash transmission.
* **Target Document**: `withdrawals/payout_xyz`
* **Payload**:
```json
{
  "userId": "malicious_user_uid",
  "amount": 500,
  "esewaId": "9800000000",
  "status": "approved"
}
```
* **Defense**: Only admins can write or modify a withdrawal record with status `"approved"`. Non-admins can only generate `"pending"` states.

### [Attack 11] Unlimited Withdrawal Loophole (Negatives/Spam)
* **Goal**: Spamming withdrawal requests containing negative numbers (`-₹1,000`) or 0 amounts to confuse the accounting engine or generate credit loops.
* **Target Document**: `withdrawals/spam_xyz`
* **Payload**:
```json
{
  "userId": "malicious_user_uid",
  "amount": -1000,
  "esewaId": "9800000000",
  "status": "pending"
}
```
* **Defense**: All resource rules for finance collections explicitly enforce `amount is number && amount >= 50`.

### [Attack 12] Injection of Raw Strings/Poison IDs
* **Goal**: Bypassing Firestore indexes or storage bounds by writing high-byte payloads or malformed character script paths.
* **Payload**: Injecting a 2MB binary string into the `notifId` or `userId` or any ID path document block.
* **Defense**: Every path variable is guarded by `isValidId()` which strictly checks `.size() <= 128` and enforces matching character sanitization.

---

## 3. Threat Matrix Auditing Validation

| Vulnerability Vector | Spec Guard | Code Check | Status |
|---|---|---|---|
| Identity Spoofing | Denied | `request.auth.uid == userId` | **SECURED** |
| State Shortcutting | Denied | `affectedKeys().hasOnly()` gates | **SECURED** |
| Value Poisoning | Denied | `isValidUser()` & `isValidID()` size validations | **SECURED** |
| Balance Inflation | Denied | `wallet < existing().wallet` checks | **SECURED** |

The following test suite logic simulates these attacks against developer endpoints to verify that all violations fail in real runtime.
