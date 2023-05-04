<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary" style="margin-bottom: 50px;">
        <div class="container-fluid">

            <router-link class="navbar-brand" to="/">
                Chat Station
            </router-link>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor01"
                aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarColor01">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <router-link class="nav-link active" to="/">
                            Home
                            <span class="visually-hidden">(current)</span>
                        </router-link>
                    </li>

                    <li class="nav-item" v-if="login">
                        <router-link class="nav-link" to="/groups">Groups</router-link>
                    </li>

                    <li class="nav-item" v-if="!login">
                        <router-link class="nav-link" to="/login">Login</router-link>
                    </li>

                    <li class="nav-item" v-if="!login">
                        <router-link class="nav-link" to="/register">Register</router-link>
                    </li>

                    <li class="nav-item dropdown" v-if="login">
                        <a v-text="$user.name" class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
                        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item" v-on:click="doLogout" href="javascript:void(0);">Logout</a></li>
            </div>
            </li>
            </ul>

            <form class="d-flex" v-on:submit.prevent="doSearch"            >
                <input class="form-control me-sm-2" type="text" v-model="query" placeholder="Search">
                <button class="btn btn-secondary my-2 my-sm-0" type="submit">Search</button>
            </form>
        </div>
        </div>
    </nav>
</template>
 
<script>

import axios from "axios"
import swal from "sweetalert2"
import { io } from 'socket.io-client'
import store from "../../vuex/store"

export default {
    data() {
        return {
            login: false,
            user: null,
            query: ""
        }
    },

    methods: {
        doSearch: async function () {
        // create form data object and add searched query in it
        const formData = new FormData()
        formData.append("query", this.query)
 
        // call an AJAX to the server
        const response = await axios.post(
            this.$apiURL + "/search",
 
            // send the form data object with the request
            formData,
 
            // pass headers that contains access token
            // so the server will know which user's contact to search
            {
                headers: this.$headers
            }
        )
 
        if (response.data.status == "success") {
            // set the contacts array to the one received from API
            store.commit("setContacts", response.data.contacts)
        } else {
            swal.fire("Error", response.data.message, "error")
        }
    },

        doLogout: async function () {
            const response = await axios.post(
                this.$apiURL + "/logout",
                null,
                {
                    headers: this.$headers
                }
            );

            if (response.data.status == "success") {
                // remove access token from local storage
                localStorage.removeItem(this.$accessTokenKey)

                window.location.href = "/login"
            } else {
                swal.fire("Error", response.data.message, "error");
            }
        },

        getUser: async function () {
            const self = this

            // check if user is logged in
            if (localStorage.getItem(this.$accessTokenKey)) {
                const response = await axios.post(
                    this.$apiURL + "/getUser",
                    null,
                    {
                        headers: this.$headers
                    }
                )

                if (response.data.status == "success") {
                    // user is logged in
                    this.$user = response.data.user
                    socketIO.emit("connected", this.$user.email)

                    socketIO.on("sendMessage", async function (data) {
                        if (self.$route.path == "/chat/" + data.data.sender.email) {
                            store.commit("appendMessage", data.data)
                        }
                        const Toast = swal.mixin({
                            toast: true,
                            position: 'bottom-right',
                            customClass: {
                                popup: 'colored-toast'
                            },
                            showConfirmButton: false,
                            timer: 10000,
                            timerProgressBar: true
                        })

                        await Toast.fire({
                            title: data.title
                        })
                    })
                    console.log(this.$user)
                } else {
                    // user is logged out
                    localStorage.removeItem(this.$accessTokenKey);
                }

                this.login = (localStorage.getItem(this.$accessTokenKey) != null);
            } else {
                this.login = false;
            }

            global.user = this.user
        },
    },

    mounted: function () {
        this.getUser();
        global.socketIO = io(this.$apiURL)

    }
}
</script>