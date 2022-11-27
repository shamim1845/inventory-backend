const asyncHandler = require("express-async-handler");
const { User } = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Token } = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  return token;
};

// Register User
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log(req.body);

  // validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields.");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password at least 6 characters.");
  }

  // check if user email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered.");
  }

  // Create a new user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate token
  const token = generateToken(user._id);

  // Send http-only cookies
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    // sameSite: "none",
    // secure: true,
  });

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user details.");
  }
});

// Login User
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password.");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup.");
  }

  // User exists, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;

    // Generate token
    const token = generateToken(user._id);

    // Send http-only cookies
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      //   sameSite: "none",
      //   secure: true,
    });

    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password.");
  }
});

// Logout User
exports.logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");

  // Send http-only cookies
  //   res.cookie("inventoryToken", "", {
  //     path: "/",
  //     httpOnly: true,
  //     expires: new Date(0),
  //     sameSite: "none",
  //     secure: true,
  //   });

  res.status(200).json({ message: "SuccessFully Loged Out." });
});

exports.getUser = asyncHandler(async (req, res) => {
  const { _id, name, email, photo, phone, bio } = req.user;
  res.status(200).json({
    _id,
    name,
    email,
    photo,
    phone,
    bio,
  });
});


// Get Login status
exports.loginStatus = (req, res) => {
    const token = req.cookies.token;

    if(!token) {
        return res.json(false);
    }
      // Verify Token
      const verified =  jwt.verify(token,process.env.JWT_SECRET);
      if(verified) {
        return res.json(true);
    }
   return  res.json(false);
}


// Update user details
exports.updateUser = asyncHandler(async(req, res) => {
  
    const user = await User.findById(req.user._id);

    if(user) {
        const { name, email, photo, phone, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.photo = req.body.photo || photo;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;

        const updatedUser = await user.save();

        if(updatedUser) {
     
          return  res.status(200).json({
                 _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                photo: updatedUser.photo,
                phone: updatedUser.phone,
                bio: updatedUser.bio,
            })
        }
    }else{
        res.status(400);
        throw new Error("User not found.");
    }

   
})

// change password
exports.changePassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body;
  //validate 
    if(!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Please add old and new Password.")
  }

  // check user exist or not
  const user = await User.findById(req.user._id);
  console.log(user);

  if(!user) {
    res.status(400);
    throw new Error("User not found, Please signup.")
  }

  // check old password verify bcrypt
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  if(!passwordIsCorrect) {
    res.status(400);
    throw new Error("Old password is not correct.")
  }

  // Save new password
  if(user && passwordIsCorrect) {
    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "password changed successful"
    })
  }

})



// Forgot password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const {email} = req.body;

  const user = await User.findOne({email});
  if(!user) {
    res.status(400);
    throw new Error("User does not exists.")
  }

  //  Delete previous Reset Token
  const prevToken = await Token.findOne({userId: user._id});
  if(prevToken) {
   await prevToken.deleteOne();
  }

  // Create a reset token
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;


// Hash toke before saving to db
const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

// Save hashed token in DB
const token =  new Token({
  userId: user._id,
  token: hashedToken,
  createdAt: Date.now(),
  expiresAt: Date.now() + 30*(60*1000),
})
await token.save();

// Construct reset URL
const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

// Construct Reset Email message
const resetEmailMessage = `
<h2>Hello ${user.name}<h2/>
<p>Please use the url below to reset your password.<p/>
<p>This reset link is valid for only 30 minutes.<p/>

<a href=${resetUrl} clicktracking=off> ${resetUrl} <a/>

<br/>
<br/>
<p>Regards...<p/>
<p style="color:red;">Inventory Team<p/>
`

// Send Email
const mailOptions = {
  email,
  subject: "Password Reset Request.",
  message: resetEmailMessage
}
try {
  const info = await sendEmail(mailOptions);
  
  if(info) {
          res.status(200).json({
        success: true,
        message: "Reset Email Sent.",
      })
    }

} catch (error) {
  res.status(500);
  throw new Error("Email not sent, please try again.")
}

});



// Reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const {resetToken} = req.params;
  const {password} = req.body;


// Hash token, then compare to token in DB
const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

// Find token in db
const userToken = await Token.findOne({token: hashedToken, expiresAt: {$gt: Date.now()}});

if(!userToken) {
  res.status(404);
  throw new Error("Invalid or Expired Token.")
}

// Find user
const user = await User.findOne({_id: userToken.userId});

if(!user) {
  res.status(500);
  throw new Error("User not found, please try again.")
}
user.password = password;
await user.save();

  // Delete previous Reset Token
  await userToken.deleteOne();


  res.status(200).json({
    success: true,
    message: "Password Reset Successful, Please Login."
  })
})