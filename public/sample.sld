<slideshow title="React and Next.js Fundamentals" author="Slides Tutor" version="1.0">
  <metadata>
    <description>A comprehensive introduction to React fundamentals and Next.js basics, covering components, hooks, routing, and server-side rendering.</description>
    <tags>react, nextjs, javascript, web development, frontend, tutorial</tags>
    <created>2025-12-09</created>
  </metadata>

  <slide order="1" transition="fade" id="title-slide">
    <h1 order="1" narration="Welcome to React and Next.js Fundamentals">
      React &amp; Next.js Fundamentals
    </h1>
    <p order="2" narration="In this presentation, we will explore the core concepts of React and discover how Next.js extends React to build powerful web applications" delay="500">
      Learn the essentials of modern web development
    </p>
    <blockquote order="3" narration="By the end, you will understand components, hooks, routing, and server-side rendering" delay="800">
      <em>From components to production-ready applications</em>
    </blockquote>
  </slide>

  <slide order="2" transition="slide-left" id="what-is-react">
    <h1 order="1" narration="Let us begin by understanding what React is">
      What is React?
    </h1>
    <p order="2" narration="React is a JavaScript library developed by Facebook for building user interfaces">
      A JavaScript library for building user interfaces
    </p>
    <ul order="3" narration="React has several key characteristics that make it powerful">
      <li order="1" narration="First, it is component-based, meaning you build encapsulated components that manage their own state">
        <strong>Component-Based:</strong> Build encapsulated components that manage their own state
      </li>
      <li order="2" narration="Second, React is declarative, which makes your code more predictable and easier to debug" delay="200">
        <strong>Declarative:</strong> Design simple views for each state in your application
      </li>
      <li order="3" narration="Third, you can learn once and write anywhere, using React for web, mobile, or even VR applications" delay="300">
        <strong>Learn Once, Write Anywhere:</strong> Use React for web, mobile, or VR
      </li>
    </ul>
  </slide>

  <slide order="3" transition="slide-left" id="react-components">
    <h1 order="1" narration="Now let us dive into React components">
      React Components
    </h1>
    <p order="2" narration="Components are the building blocks of any React application">
      Components are the building blocks of React applications
    </p>
    <div order="3">
      <h3 order="1" narration="There are two main types of components">
        Two Types of Components:
      </h3>
      <ol order="2">
        <li order="1" narration="Function components are simple JavaScript functions that return JSX">
          <strong>Function Components:</strong> Simple JavaScript functions that return JSX
          <pre order="1" narration="Here is an example of a function component" delay="300">
function Welcome(props) {
  return &lt;h1&gt;Hello, {props.name}&lt;/h1&gt;;
}</pre>
        </li>
        <li order="2" narration="Class components are ES6 classes that extend React dot Component" delay="400">
          <strong>Class Components:</strong> ES6 classes that extend React.Component
          <pre order="1" narration="Here is the same component written as a class" delay="300">
class Welcome extends React.Component {
  render() {
    return &lt;h1&gt;Hello, {this.props.name}&lt;/h1&gt;;
  }
}</pre>
        </li>
      </ol>
    </div>
  </slide>

  <slide order="4" transition="slide-right" id="react-hooks">
    <h1 order="1" narration="React Hooks revolutionized how we write React components">
      React Hooks
    </h1>
    <p order="2" narration="Hooks let you use state and other React features without writing a class">
      Hooks let you use state and other React features without writing a class
    </p>
    <div order="3">
      <h3 order="1" narration="Let us explore the most commonly used hooks">
        Common Hooks:
      </h3>
      <ul order="2">
        <li order="1" narration="useState allows you to add state to function components">
          <code>useState</code> - Add state to function components
          <pre order="1" narration="For example, you can create a counter with useState" delay="300">
const [count, setCount] = useState(0);</pre>
        </li>
        <li order="2" narration="useEffect lets you perform side effects in function components" delay="400">
          <code>useEffect</code> - Perform side effects (data fetching, subscriptions)
          <pre order="1" narration="Use it for data fetching or setting up subscriptions" delay="300">
useEffect(() =&gt; {
  document.title = `Count: ${count}`;
}, [count]);</pre>
        </li>
        <li order="3" narration="useContext allows you to access context values easily" delay="400">
          <code>useContext</code> - Access context values without nesting
        </li>
      </ul>
    </div>
  </slide>

  <slide order="5" transition="slide-up" id="what-is-nextjs">
    <h1 order="1" narration="Now that we understand React, let us explore Next.js">
      What is Next.js?
    </h1>
    <p order="2" narration="Next.js is a React framework that gives you building blocks to create fast web applications">
      A React framework for production-ready applications
    </p>
    <ul order="3" narration="Next.js provides several powerful features">
      <li order="1" narration="First, it offers built-in server-side rendering and static site generation for better performance and SEO">
        <strong>Server-Side Rendering:</strong> Built-in SSR and Static Site Generation
      </li>
      <li order="2" narration="Second, it has a file-based routing system where pages are automatically routed based on the file structure" delay="200">
        <strong>File-Based Routing:</strong> Automatic routing based on file structure
      </li>
      <li order="3" narration="Third, it includes API routes so you can build your backend API alongside your frontend" delay="200">
        <strong>API Routes:</strong> Build backend endpoints within your Next.js app
      </li>
      <li order="4" narration="Fourth, it provides automatic code splitting and optimizations for better performance" delay="200">
        <strong>Performance:</strong> Automatic code splitting and optimizations
      </li>
      <li order="5" narration="Finally, it has built-in image optimization to automatically optimize images for faster loading" delay="300">
        <strong>Image Optimization:</strong> Automatic image optimization
      </li>
    </ul>
  </slide>

  <slide order="6" transition="slide-down" id="nextjs-routing">
    <h1 order="1" narration="Let us look at how routing works in Next.js">
      Next.js Routing
    </h1>
    <p order="2" narration="Next.js uses a file-system based router built on the concept of pages">
      File-system based routing makes navigation intuitive
    </p>
    <div order="3">
      <h3 order="1" narration="Here are some routing examples">
        Routing Examples:
      </h3>
      <ul order="2">
        <li order="1" narration="Create a file called index.js in the pages directory to define the home page">
          <code>pages/index.js</code> → <strong>/</strong> (Home page)
        </li>
        <li order="2" narration="Create about.js for the about page" delay="200">
          <code>pages/about.js</code> → <strong>/about</strong>
        </li>
        <li order="3" narration="Use square brackets for dynamic routes like blog post IDs" delay="200">
          <code>pages/blog/[id].js</code> → <strong>/blog/:id</strong> (Dynamic route)
        </li>
        <li order="4" narration="Nested folders create nested routes automatically" delay="300">
          <code>pages/blog/index.js</code> → <strong>/blog</strong> (Nested route)
        </li>
      </ul>
      <blockquote order="3" narration="No configuration needed, just create files and Next.js handles the rest" delay="500">
        <em>No configuration needed - just create files!</em>
      </blockquote>
    </div>
  </slide>

  <slide order="7" transition="fade" id="summary">
    <h1 order="1" narration="Let us summarize what we have learned today">
      Summary
    </h1>
    <div order="2">
      <h3 order="1" narration="We covered the fundamentals of React and Next.js">
        Key Takeaways:
      </h3>
      <ul order="2">
        <li order="1" narration="React is a component-based library for building user interfaces">
          React is a <strong>component-based</strong> library for building UIs
        </li>
        <li order="2" narration="Hooks enable state and side effects in function components" delay="200">
          <strong>Hooks</strong> enable state and side effects in function components
        </li>
        <li order="3" narration="Next.js extends React with server-side rendering and static generation" delay="200">
          Next.js adds <strong>SSR</strong> and <strong>SSG</strong> capabilities
        </li>
        <li order="4" narration="File-based routing in Next.js makes navigation simple and intuitive" delay="200">
          <strong>File-based routing</strong> simplifies navigation
        </li>
        <li order="5" narration="Together, React and Next.js provide everything you need to build modern web applications" delay="300">
          Together, they provide a complete solution for modern web development
        </li>
      </ul>
    </div>
    <blockquote order="3" narration="Thank you for learning with us. Now go build something amazing!" delay="1000">
      <p>
        <strong>Ready to start building?</strong>
      </p>
      <p>
        <em>Visit react.dev and nextjs.org to learn more!</em>
      </p>
    </blockquote>
  </slide>
</slideshow>
