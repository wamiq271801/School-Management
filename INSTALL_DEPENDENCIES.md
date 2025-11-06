# 📦 Install Missing Dependencies

## Required for Bulk Import

The bulk import system requires one additional dependency that needs to be installed:

```bash
npm install jszip
```

Or if using bun:

```bash
bun add jszip
```

## Why is this needed?

`jszip` is used to extract and process ZIP files containing student documents during bulk import. It enables the auto-matching feature that links documents to students based on filename patterns.

## After Installation

Once installed, the bulk import feature will be fully functional:

1. Navigate to `/students` page
2. Click the "Add Student" button
3. Select "Bulk Import" from the dropdown
4. Download the Excel template
5. Fill in student data
6. Upload and import!

---

**Status:** ⚠️ Please run the install command above before using bulk import
