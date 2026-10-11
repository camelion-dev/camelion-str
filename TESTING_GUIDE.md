# Quick Testing Guide: Detailed Descriptions & Reordering

## Prerequisites
Before testing, you **must** run the database migrations in Supabase Dashboard > SQL Editor:

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project > **SQL Editor**
3. Run the following migrations in order:

### Migration 1: Catalog Reordering
```sql
-- Copy the entire content from: supabase/catalog_order.sql
-- This adds the sortOrder field and reorder_catalog_products() function
```

### Migration 2: Detailed Descriptions
```sql
-- Copy the entire content from: supabase/product_detailed_description.sql
-- This adds the detailedDescription field
```

4. Wait for both to complete successfully
5. Verify in **Schema > Tables** that new columns exist:
   - `Product.sortOrder` (integer)
   - `Product.detailedDescription` (text)

---

## Testing Checklist

### Part 1: Rich Product Descriptions

#### Step 1: Create a Product with Detailed Description
1. Log in to Admin Portal (`/admin`)
2. Click **"Manage product catalogue"** 
3. Click **"+ Add Product"**
4. Fill in basic fields:
   - Name: "Test Product with Rich Formatting"
   - Category: "Batteries"
   - Price: "1000"
   - Description (short): "A reliable battery"
5. Click **"Add detailed description"** (appears below short description)
6. Use the formatting toolbar to add content:
   - **Type**: "Features" → Select text → Click **H2** button
   - **Type**: A bulleted list → Click **• List** → Add items
   - **Format**: Add bold or italic text
   - **Add a link**: Highlight text → Click **Link** → Enter "https://example.com"
   - **Add a quote**: Type text → Highlight → Click **Quote**
7. Click **"Save Product"**
8. Check the success message

#### Step 2: View Formatted Description on Storefront
1. Go to storefront (`/`)
2. Click on your test product
3. Scroll down to **"Product details"** section (appears below short description)
4. Verify:
   - ✅ Heading ("Features") displays correctly
   - ✅ Bulleted list shows with proper indentation
   - ✅ Bold/italic formatting is visible
   - ✅ Link is clickable and styled in red
   - ✅ Quote displays with left red border

#### Step 3: Security Test (XSS Prevention)
1. Go back to admin, edit the test product
2. Click "Add detailed description" editor
3. Try typing HTML with script tags (copy the exact text):
   ```
   <script>alert('XSS')</script>
   ```
4. Click **"Save Product"**
5. Go to storefront and view product
6. Verify:
   - ✅ Script tag does NOT execute
   - ✅ No alert appears
   - ✅ Text displays safely (or is stripped)

#### Step 4: Size Limit Test
1. In admin, edit the test product's detailed description
2. Paste a very large text (>50KB) into the editor
3. Click **"Save Product"**
4. Verify:
   - ✅ Error message: "Detailed description must be text no longer than 50000 characters."
   - ✅ Product is NOT saved with oversized description

### Part 2: Drag-and-Drop Reordering

#### Step 1: Verify Reordering Interface
1. Go to Admin Portal > **"Manage product catalogue"**
2. Look for product tiles with:
   - ✅ Grip icon (≡) on the left side
   - ✅ Up/down arrow buttons on the right
3. Tiles should display in a grid

#### Step 2: Reorder via Drag-and-Drop (if implemented)
1. Try dragging a product tile to a new position
2. Verify:
   - ✅ Tile moves in real-time
   - ✅ Loading spinner appears while saving
   - ✅ Success/error message appears
3. Refresh the page
4. Verify:
   - ✅ New order persists after reload

#### Step 3: Reorder via Arrow Buttons
1. Click the **up arrow** on a product (not first in list)
2. Verify:
   - ✅ Product moves up one position
   - ✅ Loading spinner appears while saving
   - ✅ Tile reorders immediately
3. Click the **down arrow** on a product (not last in list)
4. Verify:
   - ✅ Product moves down one position
   - ✅ Order updates correctly

#### Step 4: Verify Storefront Reflects Order
1. Go to storefront (`/`)
2. Look at the product grid
3. Verify:
   - ✅ Products display in the same order as admin portal
   - ✅ Reordered products appear in new positions
   - ✅ No duplicate or missing products

---

## Common Issues & Troubleshooting

### Issue: "Add detailed description" button doesn't appear
- **Cause**: Form state not initialized
- **Fix**: Refresh the page, try creating a new product instead of editing

### Issue: Formatting toolbar buttons don't work
- **Cause**: Editor not focused
- **Fix**: Click in the editor area first, then try toolbar buttons
- **Note**: Buttons prevent default on mouseDown to keep focus

### Issue: Reordering doesn't save
- **Cause**: API error, check browser console
- **Fix**: 
  - Open DevTools (F12) > Console
  - Look for error messages
  - Check admin auth is still valid (try logout/login)

### Issue: Database migration fails in Supabase
- **Cause**: Column already exists or syntax error
- **Fix**:
  - Check SQL syntax in the migration file
  - Verify you're in the correct Supabase project
  - Try running in SQL Editor first to see error details
  - Contact Supabase support if still stuck

### Issue: "Detailed description must be text no longer than 50000 characters"
- **Cause**: Description text exceeds size limit
- **Fix**: Remove some content and save again
- **Note**: Limit includes HTML tags and formatting

---

## Testing Scenarios

### Scenario 1: Rich Formatting Preservation
**Expected**: All formatting is preserved and styled correctly
```
✓ H2/H3 headings scale correctly
✓ Lists indent and display bullets/numbers
✓ Blockquotes show left border
✓ Links are red and underlined
✓ Bold/italic render visually distinct
✓ Tables show borders and proper alignment
```

### Scenario 2: Security & Sanitization
**Expected**: Dangerous markup is stripped, safe content preserved
```
✓ <script> tags are removed
✓ onclick attributes are stripped
✓ style attributes are allowed (but limited to safe properties)
✓ href attributes are allowed on <a> tags
✓ rel="noopener noreferrer" is added to all links
✓ No console errors or warnings
```

### Scenario 3: Admin Workflow
**Expected**: Easy, intuitive editing experience
```
✓ Toggle button clearly shows/hides editor
✓ Toolbar is visible and accessible
✓ Editor has adequate height (scrollable)
✓ Placeholder text guides users
✓ Save/cancel buttons work correctly
✓ Changes persist across page reloads
```

### Scenario 4: Storefront Display
**Expected**: Content renders beautifully with correct styling
```
✓ Section appears only when description exists
✓ Heading "Product details" is visible
✓ Formatted content matches admin input
✓ Styling is consistent with site design
✓ Links are clickable and navigate correctly
✓ No layout shifts or broken styling
```

---

## Performance Checks

Open DevTools (F12) > Network tab while testing:

- ✅ API request for product save completes in < 1s
- ✅ No large image transfers for descriptions
- ✅ Storefront page load time unchanged
- ✅ No console errors or warnings

---

## Final Verification

Before declaring complete:

```bash
# In terminal at project root:
npm run typecheck  # Should: ✅ 0 errors
npm run lint       # Should: ✅ No errors
npm run build      # Should: ✅ Success
```

---

## Questions or Issues?

Refer to:
- **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`
- **Code documentation**: Check inline comments in:
  - `src/lib/product-description.ts`
  - `src/app/admin/AdminPortal.tsx` (search for RichDescriptionEditor)
  - `src/components/ProductDetails.tsx` (search for product-rich-description)
