const express = require('express');
const router = express.Router();

// ===================================================
// Controllers Imports
// ===================================================

// 🟢 Course controllers
const {
    createCourse,
    getCourseDetails,
    getAllCourses,
    getFullCourseDetails,
    editCourse,
    deleteCourse,
    getInstructorCourses,
    getCategoryPageDetails, // ✅ now imported from course controller
} = require('../controllers/course');

// 🟡 Course Progress controller
const { updateCourseProgress } = require('../controllers/courseProgress');

// 🟣 Category controllers (admin use)
const {
    createCategory,
    showAllCategories,
} = require('../controllers/category');

// 🟠 Section controllers
const {
    createSection,
    updateSection,
    deleteSection,
} = require('../controllers/section');

// 🔵 Subsection controllers
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require('../controllers/subSection');

// ⭐ Rating & Review controllers
const {
    createRating,
    getAverageRating,
    getAllRatingReview,
} = require('../controllers/ratingAndReview');

// 🔐 Middleware
const { auth, isAdmin, isInstructor, isStudent } = require('../middleware/auth');


// ===================================================
// 🧩 COURSE ROUTES
// ===================================================

// Create Course (Instructor only)
router.post('/createCourse', auth, isInstructor, createCourse);

// Sections
router.post('/addSection', auth, isInstructor, createSection);
router.post('/updateSection', auth, isInstructor, updateSection);
router.post('/deleteSection', auth, isInstructor, deleteSection);

// Subsections
router.post('/addSubSection', auth, isInstructor, createSubSection);
router.post('/updateSubSection', auth, isInstructor, updateSubSection);
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection);

// Course Data
router.post('/getCourseDetails', getCourseDetails);
router.get('/getAllCourses', getAllCourses);
router.post('/getFullCourseDetails', auth, getFullCourseDetails);

// Instructor-specific
router.get('/getInstructorCourses', auth, isInstructor, getInstructorCourses);

// Edit/Delete
router.post('/editCourse', auth, isInstructor, editCourse);
router.delete('/deleteCourse', auth, isInstructor, deleteCourse);

// Student progress
router.post('/updateCourseProgress', auth, isStudent, updateCourseProgress);

// ✅ Frontend Catalog API (fixed)
router.post('/getCategoryPageDetails', getCategoryPageDetails);


// ===================================================
// 🧩 CATEGORY ROUTES (Admin Only)
// ===================================================
router.post('/createCategory', auth, isAdmin, createCategory);
router.get('/showAllCategories', showAllCategories);


// ===================================================
// 🧩 RATINGS & REVIEWS
// ===================================================
router.post('/createRating', auth, isStudent, createRating);
router.get('/getAverageRating', getAverageRating);
router.get('/getReviews', getAllRatingReview);


module.exports = router;
