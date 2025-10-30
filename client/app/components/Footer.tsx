export const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12 py-8 text-center text-sm text-gray-600">
      <p>© {new Date().getFullYear()} FurniStore. All rights reserved.</p>
      <p className="mt-2">
        Crafted with ❤️ using <span className="font-semibold text-blue-600">Next.js</span> &{" "}
        <span className="font-semibold text-blue-600">ShadCN UI</span>.
      </p>
    </footer>
  );
};
