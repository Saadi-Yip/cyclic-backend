const { mongoose } = require("mongoose");
const Blog = require("../../models/dashboard/blog");
const {uploadFile, deleteImage} = require("../../middleware/s3"); 


const add_blog = async (req, res) => {
  if(!req.file) {
     res.status(404).json({message:"Blog Image is Required!!"});
     return true;
  }
  try {
    const { title, content, read_time, tags, excerpt, status, alt_img, meta_keywords, slug } = req.body;
    const result = await uploadFile(req.file); 
    const parsedTags = tags ? JSON.parse(tags) : [];
    let record = {
      title,
      meta_keywords,
      alt_img,
      slug: slug && slug.toLowerCase(),
      image: result && result.Location,
      image_id: result && req.file.originalname,
      content,
      excerpt,
      status: req.body.status ? JSON.parse(status) : false,
      read_time,
      user: mongoose.Types.ObjectId(req.body.user),
      category: mongoose.Types.ObjectId(req.body.category),
      tags: parsedTags.map((tag) => mongoose.Types.ObjectId(tag)),
    };
    const data = await Blog.create(record);
      res.send(data);
  } catch (err) {
    err.name ==="MongoServerError" && err.code === 11000 
    ? res.status(400).send({message:"Blog already exists"})
    : res.status(400).send({message:err.message});
  }
}

// get all Blogs
async function get_blogs(req, res) {
  let start = req.query.start;
  let end = req.query.end;
  const { limit, page, category, search, skip, tag, status, slug, title } = req.query;
  if ((page && !limit) || (skip && !limit)) {
    return res.status(401).send({
      message: "Limit is compulsory!",
    });
  }
  if (start && !end) {
    return res.status(401).send({
      message: "Enter End Date!",
    });
  }
  const limitQuery = page ? limit * page : limit * 1;
  const skipQuery = page ? 0 : (skip - 1) * limit;
  let searchQuery = {};
  // Apply Search query on differen use case
  if (search) {
    searchQuery = { $or: [{ title: { $regex: search } }] };
  }
  if (tag) {
    searchQuery = { ...searchQuery, tags: { $in: [tag] } };
  }
  if (slug) {
    searchQuery = { ...searchQuery, slug };
  }
  if (title) {
    searchQuery = { ...searchQuery, title };
  }
  if (category) {
    searchQuery = { ...searchQuery, category };
  }
  if (start && end) {
    searchQuery = { ...searchQuery, created_at: { $gte: start, $lte: end } };
  }
  if (status) {
    searchQuery = { ...searchQuery, status };
  }
  // Applying Query for fetch data
  const Query = Blog.find(searchQuery)
    .sort({ created_at: -1 })
    .skip(skipQuery)
    .limit(limitQuery)
    .populate({
      path: "user",
      model: "User",
      select: "-password",
    })
    .populate({
      path: "category",
      model: "Category",
      select: "name",
    })
    .populate({
      path: "tags",
      model: "Tag",
      select: "name",
    });

  // final query
  try {
    const blogs = await Query;
    res.status(200).send(blogs);
  } catch (err) {
    res.status(400).send(err.message);
  }
}


//  get a single existing Blogs
async function single_blog(req, res) {
  const _id = req.params.id;
  try {
    const blog = await Blog.find({ _id })
      .populate("user", "-password")
      .populate("category", "name")
      .populate("tags", "name");
    res.send(blog);
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
}


//update Blog
async function update_blog(req, res) {
  const id = req.params.id;
  const { title, content, read_time, status, slug, tags, meta_keywords, excerpt, alt_img } = req.body;
  const parsedTags = tags ? JSON.parse(tags) : [];
  let data = await Blog.findById(id);
  let result;
  if (req.file) {
    console.log(req.file.path);
    result = await uploadFile(req.file);
    await deleteImage(data.image_id, (res) => {
      console.log("res", res);
    });
  }
  let record = {
    title: title ? title : data.title,
    image: result ? result.Location : data.image,
    image_id: result ? req.file.originalname : data.image_id,
    content: content ? content : data.content,
    read_time: read_time ? read_time : data.read_time,
    created_at: data?.created_at,
    slug: slug ? slug.toLowerCase() : data.slug,
    meta_keywords: meta_keywords ? meta_keywords : data.meta_keywords,
    alt_img: alt_img ? alt_img : data.alt_img,
    updated_at: Date.now(),
    status: status ? JSON.parse(status) : JSON.parse(false),
    user: data.user,
    excerpt: excerpt ? excerpt : data.excerpt,
    category: req.body.category ? mongoose.Types.ObjectId(req.body.category) : data.category,
    tags: req.body.tags ? parsedTags.map((tag) => mongoose.Types.ObjectId(tag)) : data.tags,
  };
  const blog = await Blog.findByIdAndUpdate(id, { $set: record }); 
  if (blog) {
    let data = await Blog.findById(id).populate({ path: "user", model: "User" })
      .populate({ path: "category", model: "Category", select: "name" })
      .populate({ path: "tags", model: "Tag", select: "name" });
    if (data) {
      res.status(200).send(data);
    } else {
      res.status(500).send({ message: "Blog Updation Failed!!" });
    }
  }
}

//Remove a Blog
async function remove_blog(req, res) {
  const id = req.params.id;
  let blog = await Blog.findById(id);
  if (blog) {
    const record = Blog.findByIdAndDelete(id);
    record.then(async (resp) => {
      await deleteImage(blog.image_id);
      res.status(200).send({ message: "Blog Deleted Successfully!" });
    });
  } else {
    res.status(404).send({ message: "Blog Not Found" });
  }
}
//

module.exports = { add_blog, get_blogs, single_blog, update_blog, remove_blog };
