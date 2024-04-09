const Listing = require("../models/listing.js");//--------------mongodb schema file-------------------------
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;                                   // map sathi require kelya
const geocodingClient = mbxGeocoding({accessToken:mapToken});   // map sathi  geocoding  





module.exports.index = async(req,res,next)=>{

    let alldata = await Listing.find();
    res.render("listings/index.ejs",{alldata});
};

module.exports.showRoute = async(req,res,next)=>{
  
    let {id} = req.params;
    let idData= await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!idData)   // jr listing delete karun apn tyazya url varun show kart asu tr he flash hoil
    {
       req.flash("error","Listing Does not exist !");
      return res.redirect("/listings");
    }
    
   
   res.render("listings/show.ejs",{idData});
};

//----------------------------------------------------------------------------------------------------------
module.exports.createRoute = async(req,res,next)=>{
  
    
    let{ title,description,price,location,country} = req.body;

    let response = await geocodingClient.forwardGeocode({
      query: location,  // front end karun ghetlela location
      limit: 1
    })
      .send()
      
    let geometry = response.body.features[0].geometry; // location je yela tyze cordinate madhe conver hoil

    
    let url = req.file.path;
    let filename = req.file.filename;
   
     const user1 = new Listing({

           title:title,
           description:description,
           image:{
            url,filename
           },
           price:price,
           location:location,
           country:country,
           geometry:geometry

          });

         user1.owner = req.user._id; // yamdhe user loged in karel tevha tyaza id collect hoil ani to listing schema store hoil
         await user1.save();
         req.flash("success","New Listing Created !");
         res.redirect("/listings");
};

module.exports.editRoute = async(req,res,next)=>{
  
    let{id} = req.params;
    const idData = await Listing.findById(id);
    let originalImg = idData.image.url;
    originalImg = originalImg.replace("/upload","/upload/h_300,w_250"); // image chi qulity kami karnyasathi jo url tymadhe repace kaerne
  if(!idData)
  {
    req.flash("error","Listing Does not exist !");
    return  res.redirect("/listings");
  };

  // if(!req.isAuthenticated()){
      
  //   req.flash("error","you must be logged in to create listings !");
  //   return res.redirect("/login")
  // }

    res.render("listings/edit.ejs",{idData,originalImg});

}


module.exports.updateRoute = async(req,res,next)=>{
   
    let{id} = req.params;
    let{ title,description,price,location,country} = req.body; // jr file uplood nahikeli tr direct edit hoil hoil without image
    await Listing.updateOne({_id:id},{price:price,title:title,description,location:location,country:country});
   
    if(typeof req.file !== "undefined")  // jr apn file pn uplood krt asu tr req.body undifind nasel tevha he codition true hoil and hi
    {                                     //condition nahi lihli ani apn edit krat asto pn apn img edit nasti keli tr req.file ch nasti tyamul url,ani
                                          // ani file name empty aste ani error ala asta ata 
         let url = req.file.path;
         let filename = req.file.filename
         await Listing.updateOne({_id:id},{price:price,title:title,image:{
          url:url,
          filename:filename
         },description:description,location:location,country:country});
        
    }
    res.redirect(`/listings/${id}`);
  };


 module.exports.deleteRoute = async(req,res,next)=>{
  
    let{id} = req.params;
    
    // if(!req.isAuthenticated()){
    //   req.flash("error","you must be logged in to create listings !");
    //   return res.redirect("/login");
    // }
    await Listing.deleteOne({_id:id});
    req.flash("success","Listing Deleted !")
    res.redirect("/listings");
};