# E-Tour Guide Platform - Tour System API Documentation

## Overview

The Tour System is built on a GPS-based, multi-waypoint architecture where **Guides** create comprehensive tours and **Users** follow them via mobile. This is like Udemy for GPS-based travel guides.

## Architecture

### Core Models

#### Tour Model

- **Purpose**: Main tour metadata container
- **Key Fields**:
  - `name`: Tour title (3-100 chars)
  - `description`: Full tour description
  - `guide`: Reference to User (guide)
  - `place`: Reference to Place
  - `price`: USD pricing
  - `coverImage`: Main tour image (Cloudinary)
  - `galleryImages`: Array of tour images
  - `estimatedDuration`: Total time in minutes
  - `difficulty`: easy | moderate | challenging | expert
  - `maxGroupSize`: Maximum users per tour
  - `itemsCount`: Number of waypoints
  - `totalDistance`: km
  - `isPublished`: Visible to users
  - `isDraft`: Currently being edited
  - `categories`, `tags`, `languages`
  - `requiresGPS`, `requiresInternet`

#### TourItem Model (Waypoint)

- **Purpose**: Individual waypoints in a tour with GPS location
- **Key Fields**:
  - `title`: Waypoint name
  - `description`: Detailed info
  - `order`: Sequence in tour (0, 1, 2...)
  - `tour`: Reference to Tour
  - `location`: GeoJSON Point with coordinates [longitude, latitude]
    - `coordinates`: [-180 to 180, -90 to 90]
    - `address`: Human-readable location
    - `radius`: Proximity radius in meters
  - `coverImage`: Main waypoint image
  - `gallery`: Array of media
  - `audio`: Narration/script audio with duration
  - `script`: Spoken narration text
  - `facts`: Array of interesting facts
  - `tips`: Array of visitor tips
  - `warnings`: Array of safety warnings
  - `estimatedTime`: Time at waypoint in minutes
  - `contentType`: informational | interactive | quiz | story
  - `wheelchairAccessible`: Accessibility flag
  - `hasSeating`, `hasToilets`: Amenities

---

## API Endpoints

### TOUR MANAGEMENT

#### 1. Create Tour (Draft)

```
POST /api/tours
Content-Type: application/json
Authorization: Bearer <token>
Role: guide, admin
```

**Request Body**:

```json
{
  "name": "Historic City Walking Tour",
  "description": "Explore the heart of the city with expert guidance",
  "price": 29.99,
  "place": "507f1f77bcf86cd799439011",
  "estimatedDuration": 120,
  "difficulty": "easy",
  "maxGroupSize": 50,
  "categories": ["history", "culture"],
  "tags": ["walking", "downtown"],
  "languages": ["en", "es"],
  "requiresGPS": true,
  "requiresInternet": false
}
```

**Response** (201):

```json
{
  "success": true,
  "status": "success",
  "message": "Tour created in draft mode",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Historic City Walking Tour",
    "guide": "507f1f77bcf86cd799439013",
    "isPublished": false,
    "isDraft": true,
    "itemsCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 2. Get All Published Tours

```
GET /api/tours?category=history&difficulty=easy&priceMin=0&priceMax=100&place=507f1f77bcf86cd799439011
Authorization: Optional
```

**Query Parameters**:

- `category`: Filter by category
- `difficulty`: easy | moderate | challenging | expert
- `priceMin`, `priceMax`: Price range
- `place`: Place ID filter
- `sort`: -price, name, rating
- `fields`: id, name, price, rating
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response** (200):

```json
{
  "success": true,
  "status": "success",
  "results": 2,
  "total": 25,
  "page": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Historic City Walking Tour",
      "price": 29.99,
      "difficulty": "easy",
      "rating": 4.8,
      "guide": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "John",
        "avatar": "https://..."
      }
    }
  ]
}
```

---

#### 3. Get Guide's Tours (Draft + Published)

```
GET /api/tours/my-tours
Authorization: Bearer <token>
Role: guide, admin
```

**Response** (200):

```json
{
  "success": true,
  "status": "success",
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Historic City Walking Tour",
      "isDraft": false,
      "isPublished": true,
      "enrollmentsCount": 42,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### 4. Get Single Tour

```
GET /api/tours/:id
Authorization: Optional (or Bearer <token> for drafts)
```

**Response** (200):

```json
{
  "success": true,
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Historic City Walking Tour",
    "description": "Explore the heart of the city...",
    "price": 29.99,
    "guide": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://...",
      "email": "john@example.com"
    },
    "place": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Downtown City"
    },
    "estimatedDuration": 120,
    "difficulty": "easy",
    "itemsCount": 5,
    "totalDistance": 3.5,
    "coverImage": {
      "url": "https://...",
      "public_id": "tours/covers/xyz"
    }
  }
}
```

---

#### 5. Update Tour

```
PATCH /api/tours/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>
Role: guide (owner), admin
```

**Form Fields**:

- `name`: string (optional)
- `description`: string (optional)
- `price`: number (optional)
- `estimatedDuration`: number (optional)
- `difficulty`: enum (optional)
- `maxGroupSize`: number (optional)
- `categories`, `tags`, `languages`: arrays (optional)
- `coverImage`: file (optional) - replaces existing
- `galleryImages`: file[] (optional) - adds to gallery

**Response** (200): Updated tour object

---

#### 6. Publish Tour

```
PUT /api/tours/:id/publish
Authorization: Bearer <token>
Role: guide (owner), admin
```

**Validation**:

- Must have cover image
- Must have at least 1 waypoint (item)

**Response** (200):

```json
{
  "success": true,
  "status": "success",
  "message": "Tour published successfully",
  "data": { tour object }
}
```

---

#### 7. Delete Tour (Cascade)

```
DELETE /api/tours/:id
Authorization: Bearer <token>
Role: guide (owner), admin
```

**Cascading Actions**:

- Deletes all tour items (waypoints)
- Deletes all media from Cloudinary
- Removes enrollments
- Removes from reviews

**Response** (200):

```json
{
  "success": true,
  "status": "success",
  "message": "Tour deleted successfully"
}
```

---

#### 8. Delete Gallery Image

```
DELETE /api/tours/:id/gallery-image
Content-Type: application/json
Authorization: Bearer <token>
Role: guide (owner), admin
```

**Request Body**:

```json
{
  "public_id": "tours/gallery/xyz"
}
```

**Response** (200): Updated tour object

---

### TOUR ITEMS (WAYPOINTS)

#### 9. Create Waypoint

```
POST /api/tours/:tourId/items
Content-Type: multipart/form-data
Authorization: Bearer <token>
Role: guide (tour owner), admin
```

**Form Fields**:

```json
{
  "title": "Main Square Fountain",
  "description": "The iconic fountain built in 1850...",
  "order": 0,
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128],
    "address": "Times Square, New York, NY",
    "radius": 100
  },
  "script": "Welcome to the main square...",
  "facts": ["Built in 1850", "Made of marble"],
  "tips": ["Best visited at sunset"],
  "warnings": ["Crowded during peak hours"],
  "estimatedTime": 15,
  "contentType": "informational",
  "wheelchairAccessible": true,
  "hasSeating": true,
  "hasToilets": true
}
```

**Files**:

- `coverImage`: Main waypoint image (file)
- `gallery`: Multiple images (file[])
- `audio`: Narration audio (file)

**Response** (201):

```json
{
  "success": true,
  "status": "success",
  "message": "Waypoint created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Main Square Fountain",
    "order": 0,
    "tour": "507f1f77bcf86cd799439012",
    "location": {
      "coordinates": [-74.0060, 40.7128],
      "address": "Times Square, New York, NY"
    },
    "coverImage": { url, public_id },
    "gallery": [],
    "audio": { url, public_id, duration }
  }
}
```

---

#### 10. Get Tour Items

```
GET /api/tours/:tourId/items
Authorization: Optional
```

**Response** (200):

```json
{
  "success": true,
  "status": "success",
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Main Square Fountain",
      "order": 0,
      "location": { coordinates, address },
      "estimatedTime": 15
    }
  ]
}
```

---

#### 11. Get Single Waypoint

```
GET /api/tours/:tourId/items/:itemId
Authorization: Optional
```

**Response** (200): Complete waypoint object

---

#### 12. Update Waypoint

```
PATCH /api/tours/:tourId/items/:itemId
Content-Type: multipart/form-data
Authorization: Bearer <token>
Role: guide (tour owner), admin
```

**Form Fields**: Same as create (all optional)

**Response** (200): Updated waypoint

---

#### 13. Delete Waypoint

```
DELETE /api/tours/:tourId/items/:itemId
Authorization: Bearer <token>
Role: guide (tour owner), admin
```

**Response** (200): Success message

---

#### 14. Delete Item Gallery Image

```
DELETE /api/tours/:tourId/items/:itemId/gallery-image
Content-Type: application/json
Authorization: Bearer <token>
Role: guide (tour owner), admin
```

**Request Body**:

```json
{
  "public_id": "tours/items/gallery/xyz"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "status": "fail",
  "message": "Tour must have a cover image before publishing"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "status": "fail",
  "message": "Unauthorized: No token provided"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "status": "fail",
  "message": "Not authorized to update this tour"
}
```

### 404 Not Found

```json
{
  "success": false,
  "status": "fail",
  "message": "Tour not found"
}
```

---

## Workflow Examples

### Complete Guide Workflow

#### 1. Create Draft Tour

```bash
POST /api/tours
{
  "name": "City Walking",
  "description": "Explore downtown",
  "price": 29.99,
  "place": "...",
  "estimatedDuration": 120
}
```

#### 2. Upload Cover Image

```bash
PATCH /api/tours/{tourId}
Form:
  - coverImage: <file>
```

#### 3. Add Waypoints

```bash
POST /api/tours/{tourId}/items
Form:
  - title: "First Stop"
  - location: { type: "Point", coordinates: [-74, 40] }
  - coverImage: <file>
  - audio: <file>
```

#### 4. Publish Tour

```bash
PUT /api/tours/{tourId}/publish
```

#### 5. Tour becomes visible in `/api/tours` listings

---

## Media Storage (Cloudinary)

All images and audio are stored in Cloudinary with public IDs:

- `tours/covers/` - Main tour images
- `tours/gallery/` - Tour gallery images
- `tours/items/` - Waypoint cover images
- `tours/items/gallery/` - Waypoint gallery images
- `tours/items/audio/` - Narration audio

### Image Response Format

```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "tours/covers/abc123xyz"
}
```

---

## Geospatial Queries

TourItem uses MongoDB 2dsphere indexes for GPS proximity queries:

```javascript
// Example: Find waypoints near user location
db.tourItems.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-74.006, 40.7128],
      },
      $maxDistance: 1000, // meters
    },
  },
});
```

---

## Access Control

### Public Users

- GET published tours
- GET tour details
- GET waypoints

### Guides

- Create/edit/delete own tours
- Upload media
- Publish tours
- Manage waypoints

### Admins

- Full access to all tours
- Can edit/delete any tour

---

## Status Codes Summary

| Code | Meaning             |
| ---- | ------------------- |
| 200  | Success             |
| 201  | Created             |
| 204  | No Content (delete) |
| 400  | Bad Request         |
| 401  | Unauthorized        |
| 403  | Forbidden           |
| 404  | Not Found           |
| 500  | Server Error        |
