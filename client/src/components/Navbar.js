import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div className="container" style={styles.container}>
        <Link to="/" style={styles.logo}>
          Documents App
        </Link>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>
            My Documents
          </Link>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: "#fff",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "15px 0",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#4285f4",
    textDecoration: "none",
  },
  links: {
    display: "flex",
  },
  link: {
    color: "#5f6368",
    marginLeft: "20px",
    textDecoration: "none",
  },
};

export default Navbar;
