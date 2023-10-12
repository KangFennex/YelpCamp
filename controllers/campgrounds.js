const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");
const mapBoxToken = process.env.MAPBOX_TOKEN;

// https://api.mapbox.com/geocoding/v5/{endpoint}/{search_text}.json


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

// Create a new campground
module.exports.createCampground = async (req, res, next) => {
    const query = req.body.campground.location;
    const mapboxAPIEndpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapBoxToken}`;

    try {
        const response = await fetch(mapboxAPIEndpoint);

        if (!response.ok) {
            throw new Error(`Mapbox API request failed with status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);

        const campground = new Campground(req.body.campground);
        campground.geometry = data.features[0].geometry;
        campground.images = req.files.map(file => ({ url: file.path, filename: file.filename }));
        campground.author = req.user._id;
        await campground.save();
        req.flash('success', 'Successfully created a new campground');
        res.redirect(`/campgrounds/${campground._id}`)
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

// Render a specific campground with its ID
module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: "author"
        }
    }).populate('author');
    console.log(campground);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', { campground })
}

//Render the edit form
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', { campground })
}

// Update a campground
module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(file => ({ url: file.path, filename: file.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated campground!')
    res.redirect(`/campgrounds/${campground._id}`)
}

// Delete a campground
module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!')
    res.redirect('/campgrounds')
}