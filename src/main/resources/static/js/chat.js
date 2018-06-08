var ws;
var stompClient;
var myUsername = "unknown";
var messageTemplate = '<a href="#" class="list-group-item list-group-item-action flex-column align-items-start">\n' +
    '                    <div class="d-flex w-100 justify-content-between">\n' +
    '                        <p class="mb-1">MESSAGE_TEXT</p>\n' +
    '                        <small class="text-muted">3 days ago</small>\n' +
    '                    </div>\n' +
    '                    <small class="text-muted">MESSAGE_USERNAME</small>\n' +
    '                </a>';
$(document).ready(function () {

    ws = new SockJS('/ws');
    stompClient = Stomp.over(ws);


    stompClient.connect({}, function (frame) {

        myUsername = JSON.parse(JSON.stringify(frame)).headers['user-name'];
        updateMyUsername();

        stompClient.subscribe("/app/chat.participants", function (message) {
            showUsernames(message);
        });

        stompClient.subscribe("/topic/chat.login", function (message) {
            addUsername(message);
        });

        stompClient.subscribe("/topic/chat.logout", function (message) {
            removeUsername(message);
        });

        stompClient.subscribe("/topic/chat.public", function (message) {
            addPublicMessage(message.body);
        });

        stompClient.subscribe("/user/exchange/amq.direct/chat.private", function (message) {
            addPrivateMessage(message.body);
        });

    }, function (error) {
        console.log(error);
        alert("Bloody hell, something went wrong!")
    });

    $('#submit').on('click', function () {
        sendData();
    });

    $('#privateSubmit').on('click', function () {
        sendPrivate();
    });

    $('#publicSubmit').on('click', function () {
        sendPublic();
    });

    function sendPrivate(){
        var username = $('#privateMessageUsernameInput').val();
        var data = $("#privateMessageDataInput").val();
        stompClient.send("/app/chat.private." + username, {}, JSON.stringify({ message: data, username: 'me'}));
        addPrivateMessage(JSON.stringify({ message: data, username: 'me'}));
        $('#privateMessageUsernameInput').val('');
        $('#privateMessageDataInput').val('');
    }

    function sendPublic(){
        var data = $("#publicMessageDataInput").val();
        stompClient.send("/app/chat.public", {}, JSON.stringify({ message: data }));
        $('#publicMessageDataInput').val('');
    }

    function addPrivateMessage(message) {
        var parsedMessage = JSON.parse(message);
        var from = parsedMessage['username'];
        var text = parsedMessage['message'];
        var messageHTML = messageTemplate.replace('MESSAGE_TEXT', text).replace("MESSAGE_USERNAME", from);
        $('#privateChat').append(messageHTML);
    }

    function addPublicMessage(message) {
        var parsedMessage = JSON.parse(message);
        var from = parsedMessage['username'];
        var text = parsedMessage['message'];
        var messageHTML = messageTemplate.replace('MESSAGE_TEXT', text).replace("MESSAGE_USERNAME", from);
        $('#publicChat').append(messageHTML);
    }

    function removeUsername(message){
        $('#' + JSON.parse(message.body).username).remove()
    }

    function showUsernames(messages) {
        $('#usernames').html();
        JSON.parse(messages.body).forEach(function(message){
            if(message.username !== myUsername) {
                $('#usernames').append('<li class="list-group-item" id="' + message.username + '">' + message.username + '</li>');
            }
        });
    }

    function addUsername(message){
        $('#usernames').html();
        $('#usernames').append('<li class="list-group-item" id="' + JSON.parse(message.body).username + '">' + JSON.parse(message.body).username + '</li>');
    }

    function updateMyUsername(){
        $('#myUsername').text(myUsername);
    }

    updateMyUsername();
});