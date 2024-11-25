import mongoose from "mongoose";
const postSchema=mongoose.Schema({
    myFile :string
}
);
export default mongoose.models.posts || mongoose.model('post',postSchema)