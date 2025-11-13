
const UserPage = () => {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">
          User Management
        </h2>
        <p className="text-base text-slate-600">
          Manage system administrators and user roles.
        </p>
      </header>
      
      <div className="p-8 border border-dashed rounded-lg bg-white shadow-sm text-center text-slate-500">
        Nội dung quản lý User sẽ được đặt ở đây.
      </div>
    </section>
  );
};

export default UserPage;