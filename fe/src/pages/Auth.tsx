import { api } from "../utils/API";
import React, { useState } from "react";
import { AxiosError } from "axios";

export default function Auth() {
  const [errMessage, setErrMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    try {
      e.preventDefault();

      setLoading(true);

      const formData = new FormData(e.target as HTMLFormElement);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      if (!username || !password) {
        throw new Error("Username and password are required.");
      }

      const res = await api.put('/auth', { username, password });
      if (res.status !== 200) {
        throw new Error('Authentication failed: ' + res.data.message);
      } else {
        localStorage.setItem('userData', JSON.stringify(res.data));
        location.reload();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof AxiosError) {
        setErrMessage(err.response?.data.message);
      } else if (err instanceof Error) {
        setErrMessage(err.message);
      } else {
        setErrMessage("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }

  }

  return (
    <>
      <div className="bg-[#64CCC5] w-screen h-screen flex justify-center items-center">

        {/* Box */}
        <div className="bg-white md:px-24 md:py-16 sm:px-16 sm:py-8 p-8 border-b-4 rounded-xl shadow-lg">

          <img src="Logo.svg" alt="logo" className="mx-auto mb-16" />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <div className="border rounded-md mb-8 lg:w-[600px] md:w-[400px] flex">
                <img src="Person.svg" alt="person" className="inline p-2" width="35" />
                <input name="username" type="text" placeholder="Username" className="w-full p-2 focus:outline-none" />
              </div>
              <div className="border rounded-md mb-8 lg:w-[600px] md:w-[400px] flex">
                <img src="Lock.svg" alt="lock" className="inline p-2" width="35" />
                <input name="password" type="password" placeholder="Password" className="w-full p-2 focus:outline-none" />
              </div>
            </div>
            <button disabled={loading} type="submit" className={`button rounded-md w-full bg-[#04364A] text-white p-2 ${loading ? "cursor-not-allowed opacity-50" : ""}`}>Submit</button>
          </form>
          <p className="rounded-md w-full p-2 bg-red-500 text-white text-center mt-2" style={errMessage == null ? {display: "none"} : {}}>⚠ {errMessage}</p>
        </div>
      </div>
    </>
  )
}