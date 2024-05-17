const Provider = require("../../models/services/Provider"); 
const {uploadFile, deleteImage} = require("../../middleware/s3");


 

 /*** create new provider ***/
const add_provider = async (req, res) => {
  const { name, service, speed, phone, offer, description } = req.body;
  // if(!req.file) {
  //   res.status(400).send({message: "Provider's image is required!"})
  //   return true;
  // } 
    const cloud_image = await uploadFile(req.file);
    let speeds = Number(speed);
    let provider = {name,service,phone,offer,description,image:cloud_image.Location,
      image_id:req.file.originalname,speed:speeds};
    const record = Provider.create(provider);
    record.then((resp) => {
      res.send(resp);
    }).catch(err =>{res.status(400).json({message: err.message})})
};


/*** Get providers from Database ***/
const get_provider = (req, res) => {
  Provider.find(req.query).then(provider =>{res.status(200).json(provider)})
    .catch(err =>{res.status(404).json({message:"record not found " + err})})
};


/*** edit an existing provider ***/
const edit_provider = (req, res) => {
  Provider.findById(req.params.id)
  .then(provider =>{res.status(200).json(provider)})
  .catch(err =>{res.status(404).json({message:"provider not found " + err})});
};


/*** update an existing provider ***/
const update_provider = async (req, res) => {
  const id = req.params.id;
  const { name, service, speed, phone, offer, description } = req.body;
  try {
    let item = await Provider.findById(id);
    console.log(item);
    let result;
    if (req.file) {
      result = await uploadFile(req.file);
      await deleteImage(item.image_id);
    }
    console.log(result);
    const data = {
      name:name || item.name,
      image: result?result.Location : item.image,
      image_id: result?result.Key : item.image_id,
      service: service || item.service,
      phone: phone || item.phone,
      offer: offer || item.offer,
      description: description || item.description,
      speed: speed?Number(speed):item.speed,
    };
    const provider = await Provider.findByIdAndUpdate(id, { $set: data });
    if (provider) {
      let result = await Provider.findById(id);
      res.status(200).send(result);
    } else {
      res.status(404).send({ message: "provider not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(409).send({ message: err });
  }
};


/*** Remove a provider ***/
const remove_provider = async (req, res) => {
  Provider.findById(req.params.id).then(async (provider) =>{
    await deleteImage(provider.image_id);
    Provider.findByIdAndDelete(req.params.id).then(provider =>{
      res.status(200).json({ message: "provider deleted successfully!" });
    }).catch(err =>{res.status(409).json({message:"record not deleted!!"})})
  })
};


/*** Export all funtions ***/
module.exports = { add_provider, get_provider, edit_provider, update_provider, remove_provider};
