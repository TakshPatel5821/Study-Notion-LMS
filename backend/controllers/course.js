const Course = require('../models/course');
const User = require('../models/user');
const Category = require('../models/category');
const Section = require('../models/section');
const SubSection = require('../models/subSection');
const CourseProgress = require('../models/courseProgress');
const { uploadImageToCloudinary, deleteResourceFromCloudinary } = require('../utils/imageUploader');
const { convertSecondsToDuration } = require("../utils/secToDuration");


// ======================================================
// 🟢 Create New Course
// ======================================================
exports.createCourse = async (req, res) => {
    try {
        let { courseName, courseDescription, whatYouWillLearn, price, category, instructions: _instructions, status, tag: _tag } = req.body;
        const tag = JSON.parse(_tag);
        const instructions = JSON.parse(_instructions);
        const thumbnail = req.files?.thumbnailImage;

        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail || !instructions.length || !tag.length) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        if (!status || status === undefined) status = "Draft";

        const instructorId = req.user.id;
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const thumbnailDetails = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorId,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            tag,
            status,
            instructions,
            thumbnail: thumbnailDetails.secure_url,
            createdAt: Date.now(),
        });

        await User.findByIdAndUpdate(instructorId, { $push: { courses: newCourse._id } }, { new: true });
        await Category.findByIdAndUpdate(category, { $push: { courses: newCourse._id } }, { new: true });

        return res.status(200).json({
            success: true,
            data: newCourse,
            message: 'New course created successfully',
        });
    } catch (error) {
        console.error('❌ Error while creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Error while creating new course',
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Get All Courses
// ======================================================
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            {},
            {
                courseName: true,
                courseDescription: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true,
            }
        )
            .populate({
                path: 'instructor',
                select: 'firstName lastName email image',
            })
            .exec();

        return res.status(200).json({
            success: true,
            data: allCourses,
            message: 'Fetched all courses successfully',
        });
    } catch (error) {
        console.error('❌ Error while fetching all courses:', error);
        res.status(500).json({
            success: false,
            message: 'Error while fetching courses',
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Get Course Details
// ======================================================
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;

        const courseDetails = await Course.findOne({ _id: courseId })
            .populate({
                path: "instructor",
                populate: { path: "additionalDetails" },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: { path: "subSection", select: "-videoUrl" },
            })
            .exec();

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Course with id ${courseId} not found`,
            });
        }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                totalDurationInSeconds += parseInt(subSection.timeDuration || 0);
            });
        });

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        return res.status(200).json({
            success: true,
            data: { courseDetails, totalDuration },
            message: 'Fetched course details successfully',
        });
    } catch (error) {
        console.error('❌ Error while fetching course details:', error);
        res.status(500).json({
            success: false,
            message: 'Error while fetching course details',
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Get Full Course Details (Authenticated)
// ======================================================
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        const courseDetails = await Course.findOne({ _id: courseId })
            .populate({
                path: "instructor",
                populate: { path: "additionalDetails" },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: { path: "subSection" },
            })
            .exec();

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            });
        }

        const courseProgress = await CourseProgress.findOne({ courseID: courseId, userId });
        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                totalDurationInSeconds += parseInt(subSection.timeDuration || 0);
            });
        });
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgress?.completedVideos || [],
            },
        });
    } catch (error) {
        console.error('❌ Error fetching full course details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching full course details',
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Edit Course Details
// ======================================================
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        if (req.files?.thumbnailImage) {
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
            course.thumbnail = thumbnailImage.secure_url;
        }

        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key]);
                } else {
                    course[key] = updates[key];
                }
            }
        }

        course.updatedAt = Date.now();
        await course.save();

        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: { path: "additionalDetails" },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: { path: "subSection" },
            })
            .exec();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        });
    } catch (error) {
        console.error('❌ Error while updating course:', error);
        res.status(500).json({
            success: false,
            message: "Error while updating course",
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Get Instructor Courses
// ======================================================
exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const instructorCourses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: instructorCourses,
            message: 'Courses by instructor fetched successfully',
        });
    } catch (error) {
        console.error('❌ Error while fetching instructor courses:', error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Delete Course
// ======================================================
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const studentsEnrolled = course.studentsEnrolled;
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, { $pull: { courses: courseId } });
        }

        await deleteResourceFromCloudinary(course?.thumbnail);

        const courseSections = course.courseContent;
        for (const sectionId of courseSections) {
            const section = await Section.findById(sectionId);
            if (section) {
                const subSections = section.subSection;
                for (const subSectionId of subSections) {
                    const subSection = await SubSection.findById(subSectionId);
                    if (subSection) {
                        await deleteResourceFromCloudinary(subSection.videoUrl);
                    }
                    await SubSection.findByIdAndDelete(subSectionId);
                }
            }
            await Section.findByIdAndDelete(sectionId);
        }

        await Course.findByIdAndDelete(courseId);
        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error('❌ Error while deleting course:', error);
        res.status(500).json({
            success: false,
            message: "Error while deleting course",
            error: error.message,
        });
    }
};


// ======================================================
// 🟢 Get Category Page Details  ( <-- Added New Function )
// ======================================================
exports.getCategoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body;
        console.log("📘 Fetching Category Page Details for:", categoryId);

        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                populate: {
                    path: "instructor",
                    select: "firstName lastName image",
                },
            })
            .exec();

        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const allCategories = await Category.find().populate("courses").exec();
        const randomCategories = allCategories.filter(cat => cat._id.toString() !== categoryId).slice(0, 5);

        res.status(200).json({
            success: true,
            message: "Fetched category page data successfully",
            data: {
                selectedCategory,
                otherCategories: randomCategories,
            },
        });
    } catch (error) {
        console.error("❌ Error in getCategoryPageDetails:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching category page details",
            error: error.message,
        });
    }
};
