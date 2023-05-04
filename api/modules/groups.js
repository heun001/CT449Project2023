// include auth module for getting logged-in user
const auth = require("./auth");
var ObjectId = require("mongodb").ObjectId;

// fs module to save group images
const fileSystem = require("fs");

module.exports = {
  // initialize the module
  init: function (app, express) {
    // create a new router object from express
    const router = express.Router();

    router.post("/inviteMember", auth, async function (request, result) {
      // get logged-in users
      const user = request.user;

      // get unique ID of group
      const _id = request.fields._id;

      // get email of user
      const email = request.fields.email;

      // check if group exists
      const group = await db.collection("groups").findOne({
        _id: ObjectId(_id),
      });

      if (group == null) {
        result.json({
          status: "error",
          message: "Group does not exists.",
        });
        return;
      }

      // check if user exists
      const member = await db.collection("users").findOne({
        email: email,
      });

      if (member == null) {
        result.json({
          status: "error",
          message: "User does not exists.",
        });
        return;
      }

      // check if user is already a member or admin of group
      let isAlreadyMember = false;
      for (let a = 0; a < group.members.length; a++) {
        if (group.members[a].user.email == email) {
          isAlreadyMember = true;
          break;
        }
      }

      if (group.createdBy.email == email || isAlreadyMember) {
        result.json({
          status: "error",
          message: "User is already a member of this group.",
        });
        return;
      }

      // insert in group's members array
      await db.collection("groups").findOneAndUpdate(
        {
          _id: group._id,
        },
        {
          $push: {
            members: {
              _id: ObjectId(),
              status: "pending", // pending, accepted
              sentBy: {
                _id: user._id,
                name: user.name,
                email: user.email,
              },
              user: {
                _id: member._id,
                name: member.name,
                email: member.email,
              },
              createdAt: new Date().getTime(),
            },
          },
        }
      );

      // send notification to the user
      await db.collection("users").findOneAndUpdate(
        {
          _id: member._id,
        },
        {
          $push: {
            notifications: {
              _id: ObjectId(),
              type: "group_invite",
              group: {
                _id: group._id,
                name: group.name,
              },
              isRead: false,
              sentBy: {
                _id: user._id,
                name: user.name,
                email: user.email,
              },
              createdAt: new Date().getTime(),
            },
          },
        }
      );

      // send the response back to client
      result.json({
        status: "success",
        message: "Invitation has been sent.",
      });
    });

    // POST API to fetch groups
    router.post("/fetch", auth, async function (request, result) {
      // get logged-in users
      const user = request.user;

      // get groups of which I am an admin or a member
      const groups = await db
        .collection("groups")
        .find({
          $or: [
            {
              "createdBy._id": user._id,
            },
            {
              "members.user._id": user._id,
            },
          ],
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      // return the groups and logged-in user object
      result.json({
        status: "success",
        message: "Groups has been fetched.",
        groups: groups,
        user: user,
      });
    });

    // create a POST method
    router.post("/add", auth, async function (request, result) {
      // get logged-in user
      const user = request.user;

      // get name of group
      const name = request.fields.name;

      // get picture of group
      const picture = request.files.picture;

      // get current time
      const createdAt = new Date().getTime();

      // create group object for saving in Mongo DB
      const object = {
        name: name,
        createdBy: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        // array that will store list of all members
        members: [],
        createdAt: createdAt,
      };

      // check if file is selected and file type is image
      if (
        picture != null &&
        picture.size > 0 &&
        (picture.type == "image/png" ||
          picture.type == "image/jpeg" ||
          picture.type == "image/HEIC")
      ) {
        // set the unique name of file
        const dateObj = new Date();
        const datetimeStr =
          dateObj.getFullYear() +
          "-" +
          (dateObj.getMonth() + 1) +
          "-" +
          dateObj.getDate() +
          " " +
          dateObj.getHours() +
          ":" +
          dateObj.getMinutes() +
          ":" +
          dateObj.getSeconds();
        const fileName =
          "ChatStation-" + name + "-" + datetimeStr + "-" + picture.name;

        // set the path of file, you might need to create a new folder "groups" in uploads folder
        const filePath = "uploads/groups/" + fileName;

        // attach this picture to the groups object
        object.picture = {
          size: picture.size,
          path: filePath,
          name: fileName,
          displayName: picture.name,
          type: picture.type,
        };

        // read the content of image
        fileSystem.readFile(picture.path, function (error, data) {
          if (error) {
            console.error(error);
          }

          // save the file
          fileSystem.writeFile(filePath, data, function (error) {
            if (error) {
              console.error(error);
            }
          });

          // delete the temporary file path
          fileSystem.unlink(picture.path, function (error) {
            if (error) {
              console.error(error);
            }
          });
        });
      }

      // save the group in Mongo DB
      const group = await db.collection("groups").insertOne(object);

      // attach the newly inserted ID to the group's object
      object._id = group.insertedId;

      // send the response back to client along with new group object
      result.json({
        status: "success",
        message: "Group has been created.",
        group: object,
      });
    });

    // handle all requests by this router, that starts with "/groups"
    app.use("/groups", router);
  },
};
