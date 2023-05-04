<template>
    <div class="container">
        <div class="row">
            <div class="offset-md-10 col-md-2">
                <!-- link to create group -->
                <router-link class="btn btn-primary" to="/groups/add">Add group</router-link>
            </div>
            <!-- show all groups -->
            <div class="col-md-12">
                <table class="table table-hover">
                    <!-- heading of table -->
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Created by</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        <!-- loop through all groups -->
                        <tr v-for="group in groups" v-bind:key="group._id">
                            <td>
                                <!-- show group name -->
                                <span v-text="group.name"></span>
                            </td>

                            <!-- the admin of group -->
                            <td v-text="group.createdBy.name"></td>

                            <td style="display: flex;">

                                <!-- buttons to edit and delete the group, only for group admin -->
                                <template v-if="user != null && group.createdBy._id == user._id">
                                    <!-- edit the group -->
                                    <router-link v-bind:to="'/groups/edit/' + group._id" class="btn btn-primary"
                                        style="margin-right: 10px;">Edit</router-link>

                                    <!-- delete the group -->
                                    <form v-on:submit.prevent="deleteGroup">
                                        <input type="hidden" name="_id" v-bind:value="group._id" required />
                                        <input type="submit" v-bind:value="isDeleting ? 'Deleting...' : 'Delete'"
                                            v-bind:isDeleting="disabled" class="btn btn-danger" />
                                    </form>
                                </template>
                                <!-- a button to invite member -->
                                <a v-bind:data-id="group._id" v-on:click.prevent="inviteMember" class="btn btn-success"
                                    style="margin-left: 10px;">Invite member</a>

                            </td>

                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
 
<script>

// axios for calling AJAX
import axios from "axios"

// to show pop-up alerts
import swal from "sweetalert2"

// vuex store is used to use the variables throughout the application
import store from "../vuex/store"

export default {
    data() {
        return {
            isDeleting: false,

            // logged-in user object
            user: null
        }
    },

    // using computed property, we can update value from anywhere in the app
    computed: {
        groups() {
            return store.getters.getGroups
        }
    },

    methods: {

        // method to invite member
        inviteMember: function () {
            // get vue instance
            const self = this

            // get group _id from anchor tag
            const _id = event.target.getAttribute("data-id")

            // show pop-up and ask for user email to send invitation to join group
            swal.fire({
                title: 'Enter user email',
                input: 'text',
                inputAttributes: {
                    autocapitalize: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Invite User',
                showLoaderOnConfirm: true,
                preConfirm: async function (email) {

                    // called when email address is entered

                    // attach group ID and user email to the form data object
                    const formData = new FormData()
                    formData.append("_id", _id)
                    formData.append("email", email)

                    // using fetch API send the AJAX request
                    return fetch(self.$apiURL + "/groups/inviteMember", {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem(self.$accessTokenKey)
                        }
                    })
                        .then(function (response) {
                            // called when the response is received from server

                            // check if the status code is not 200
                            if (!response.ok) {
                                throw new Error(response.statusText)
                            }

                            // check if there isn't any error from server
                            return response.json().then(function (value) {
                                if (value.status == "error") {
                                    throw new Error(value.message)
                                }

                                // return the success response
                                return value
                            })
                        })
                        .catch(function (error) {
                            // show error inside sweetalert
                            swal.showValidationMessage(`Request failed: ${error}`)
                        })
                },
                // disable clicking outside
                allowOutsideClick: function () {
                    !swal.isLoading()
                }
            }).then(function (result) {
                // show success response in sweetalert dialog
                if (result.isConfirmed) {
                    swal.fire("Invite member", result.value.message, "success")
                }
            })
        },

        // a method to fetch all groups from API
        getData: async function (request, result) {
            const response = await axios.post(
                this.$apiURL + "/groups/fetch",
                null,
                {
                    headers: this.$headers
                }
            )

            if (response.data.status == "success") {
                // set logged-in user object
                this.user = response.data.user

                // call the setGroups from vuex store
                store.commit("setGroups", response.data.groups)
            } else {
                swal.fire("Error", response.data.message, "error");
            }
        }
    },

    // get the data when this component is mounted
    mounted: function () {
        this.getData()
    }
}
</script>