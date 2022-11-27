const mongoose =  require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required:[true, "Please add your name."],
            minLength: [3, "Name must be at least 3 characters."],
            maxLength: [23, "Name can't be more than 23 characters."]
        },
        email: {
            type: String,
            required:[true, "Please add your email."],
            unique: true,
            trim: true,
            match: [
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                "Please enter a valid email"
            ]
        },
        password: {
            type: String,
            required: [true, "Please add a Password."],
            minLength: [6, "Password must be at least 6 characters."],
            // maxLength: [23, "Password can't be more than 23 characters."]
        },
        photo: {
            type: String,
            required: [true, "Please add a photo."],
            default: "https://ibb.co/d6BysfB"
        },
        phone: {
            type: String,
            default: "+88 "
        },
        bio: {
            type: String,
            maxLength: [250, "Bio can't be more than 250 characters."],
            default: "bio"
        }
},{
    timestamps: true
}
);

// Encrypt password before saving to the database
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) {
        return next();
    }
          // Hashed password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(this.password, salt);
          this.password = hashedPassword;
          next();
})


exports.User = mongoose.model("User", userSchema);  