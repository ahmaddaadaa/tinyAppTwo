    <!-- Login Form -->
    
    <% if(username === undefined) { %>
    <form  action="/login" method="POST">
      <form  action="/login" method="POST"> </form>
      <input  type="text" name="username" placeholder="Username">
      <button  type="submit" style="margin-right: 10px;">Login</button>
    </form>
    
  
  <% } else { %>
    <p class="navbar-nav" style="margin-right: 10px;">Logged in as: <%= username['username'] %>!</p>
    <form action="/logout" method="POST">
      <button type="submit" style="margin-right: 10px;">Logout</button>
    </form>
  <% } %>
  <form action="/register" method="GET">
    <button type="submit">Register</button>
  </form>



    <% if(users['userId'] === undefined) { %>
    <p class="navbar-nav" style="margin-right: 10px;">Please login or register!</p>
    <form action="/login" style="margin-right: 10px;" method="GET">
      <button type="submit">Login</button>
    </form>
    <form action="/register" method="GET">
      <button type="submit">Register</button>
    </form>
    <% } else { %>
      <p class="navbar-nav" style="margin-right: 10px;">Logged in as: <%= users['userId'] %>!</p>
      <form action="/logout" method="POST">
        <button type="submit" style="margin-right: 10px;">Logout</button>
      </form>
      <% } %>
