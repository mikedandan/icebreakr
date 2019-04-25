import React, { useState, useEffect } from 'react';
import { Button } from 'native-base';
import { Text, View, ScrollView, KeyboardAvoidingView, AsyncStorage} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import { Actions } from 'react-native-router-flux';
import LinearGradient from 'react-native-linear-gradient';
import BackButton from '../components/BackButton';
import { ChatWindow, ChatFooter } from '../components/ChatWindow';
import io from 'socket.io-client';
import NavBar from '../components/Nav';
import decode from 'jwt-decode';

let socket = io(`http://10.0.2.2:3000/group`);

export default function GroupChat() {

    const [positions, setPositions] = useState({ lat: 0, lon: 0 });
    const [messages, setMessages] = useState([]);
    const [userInput, setInput] = useState("Your Message Here");
    const [user, setUser] = useState({});

    const getToken = async () => {
        console.log("==============================");
        try {
            console.log("YAOZORS")
            const token = await AsyncStorage.getItem('token');
            if (token !== null) {
                // We have data!!
                console.log('user saved locally');
                //console.log(token);
                const decoded = decode(token);
                console.log(decoded);
                setUser({ 
                    userID: decoded.id,
                    nickName: decoded.displayName,
                    picture: decoded.picture
                 });
            } else {
                console.log('no data');
            }

        } catch (error) {
            // Error retrieving data
        }
    }

    const getChatHistory = async (position) => {
        console.log("VOID")
        try {
            console.log(`Location before sent to backend: \n ${position.lat},${position.lon}`);
            const data = {
                namespace: "group",
                lat: position.lat,
                lon: position.lon
            };
            const res = await axios.post('http://10.0.2.2:3000/api/message/filterHistory', data);
            return res.data;
        } catch (err) {
            console.log(err);
        }
    };

    const load = async () => {

        Geolocation.getCurrentPosition(
            async (position) => {
                console.log("In Geolocation Function" + position.coords.latitude + position.coords.longitude);
                setPositions({ lat: position.coords.latitude, lon: position.coords.longitude });
                const chatHistory = await getChatHistory({ lat: position.coords.latitude, lon: position.coords.longitude });
                setMessages(chatHistory);
            },
            (error) => {
                // See error code charts below.
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    }

    const postMessage = async (newMessage) => {
        // let messageArray = this.state.messages;
        // await messageArray.push(newMessage);
        // const self = this;
        return axios.post('http://10.0.2.2:3000/api/message/new', newMessage)
            .then(async function (response) {
                console.log(response);
                //after pushing to database, clear the input
                //setInput(""); this part doesnt work 100% yet will fix once we get everything done
                let chatHistory = await getChatHistory(positions);
                setMessages(chatHistory);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    const handleMessageSent = async () => {
        console.log("WEEEWOO");
        const newMessage = {
            "nickName": user.nickName,
            "message": userInput,
            "picture": user.picture,
            "userID": user.userID,
            "lon": positions.lon,
            "lat": positions.lat,
            "namespace": "group",
            "date": Date.now()
        }
        //https://icebreakr-serv.herokuapp.com/
        socket = io(`http://10.0.2.2:3000/group`, {
            query: {
                username
            }
        });
        console.log(userInput);
        await socket.emit('newMessageToServer', newMessage);
        await postMessage(newMessage);
    }

    useEffect(() => {
        load();
        getToken()
        // socket.on('messageToClients',async () =>{
        //     // const newMsg = buildHTML(msg);
        //     // document.querySelector('#messages').innerHTML += newMsg;
        //     const newMessages = await getChatHistory();
        //     setMessages(newMessages);
        // });
    }, []);

    return (
        <View style={styles.container} behavior="padding" enabled>

            {/* BackButton */}
            <Text>Lat: {positions.lat}Lon: {positions.lon}</Text>
            <Text>User: {user.userID}</Text>
            <Text>Picture: {user.picture}</Text>
            <Text>Name: {user.nickName}</Text>


            {/* Chat Container */}
            <View style={{ backgroundColor: '#E3E9EC', flex: 7 }}>
                <ChatWindow
                    state={messages}
                    currentUser={user}
                />
            </View>

            {/* Chat Footer */}
            <KeyboardAvoidingView behavior="padding">

                <ChatFooter
                    onClick={handleMessageSent}
                    onInputChange={setInput}
                    state={userInput}
                />
            </KeyboardAvoidingView>

            {/* <Text style={styles.instructions}>Test Loc: Long: {this.state.long} Lat: {this.state.lat}</Text> */}

        </View>
    );
  }

 

const styles = {
  thisIsAStyle: {
    fontSize: 50,
  },
  container: {
    flex: 1,
    flexDirection: "column"
  },
  backButton: {
    left: 0,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  }
};