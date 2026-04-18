-- Migration V11: Expand image storage columns to MEDIUMTEXT
-- TEXT columns (max ~65KB) are too small for base64-encoded images.
-- MEDIUMTEXT supports up to 16MB which comfortably handles typical photos.

ALTER TABLE bookedDestinations MODIFY COLUMN imageUrl MEDIUMTEXT;
ALTER TABLE bookingPhotos MODIFY COLUMN imageUrl MEDIUMTEXT NOT NULL;
