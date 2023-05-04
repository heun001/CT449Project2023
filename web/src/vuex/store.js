import { createStore } from "vuex"
 
export default createStore({
    state() {
        return {
            messages: [],
            contacts: [],
            groups: [],


        }
    },
 
    mutations: {    
        setGroups (state, newGroups) {
            state.groups = newGroups
        },

        setContacts (state, newContacts) {
            state.contacts = newContacts
        },

        appendMessage (state, newMessage) {
            state.messages.push(newMessage)
        },
 
        prependMessage (state, newMessage) {
            state.messages.unshift(newMessage)
        },
 
        setMessages (state, newMessages) {
            state.messages = newMessages
        },
    },
 
    getters: {
        getGroups (state) {
            return state.groups
        },
        getMessages (state) {
            return state.messages
        },
        getContacts (state) {
            return state.contacts
        }
    }
})